const { handleUpload } = require('@vercel/blob/client');
const { get: getBlob, del: delBlob } = require('@vercel/blob');
const { getRedis } = require('../lib/redis');
const { getSession, getUserByUsername, sendJson } = require('../lib/auth');

const ALLOWED_EXT = new Set(['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','jpg','jpeg','png','webp']);
const ALLOWED_MIME = new Set([
  'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain',
  'image/jpeg','image/png','image/webp','application/octet-stream'
]);
const ADMIN_ENV = 'ADMIN_USERNAME';
function clean(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function extOf(name) { const p = String(name || '').toLowerCase().split('.'); return p.length > 1 ? p.pop() : ''; }
function isAdmin(username) { const allowed = String(process.env[ADMIN_ENV] || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean); return !!allowed.length && allowed.includes(String(username||'').trim().toLowerCase()); }
function validLessonKey(v) { return /^[a-zA-Z0-9._:-]{1,180}$/.test(String(v||'')); }
function parseJsonBody(req){ let body=req.body||{}; if(typeof body==='string'){try{body=JSON.parse(body||'{}')}catch{body={}}} return body; }

function validStudentPathname(v) {
  const p = String(v || '').trim();
  return p.startsWith('student-library/') &&
    p.length <= 500 &&
    !p.includes('..') &&
    !p.includes('\\') &&
    !p.includes('\r') &&
    !p.includes('\n');
}

async function studentLibraryDownload(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const pathname = u.searchParams.get('pathname') || '';
  if (!validStudentPathname(pathname)) {
    return sendJson(res, 400, { ok: false, message: 'Đường dẫn tài liệu không hợp lệ.' });
  }

  const session = await getSession(req);
  if (!session) return sendJson(res, 401, { ok: false, message: 'Bạn cần đăng nhập để tải tài liệu.' });

  // Verify the pathname belongs to a document currently registered in the student library.
  const redis = getRedis();
  const raw = await redis.lrange('phuc:student-library', 0, 499);
  const items = raw.map(x => {
    if (!x) return null;
    if (typeof x === 'object') return x;
    try { return JSON.parse(x); } catch { return null; }
  }).filter(Boolean);
  const item = items.find(x => String(x.pathname || '') === pathname);
  if (!item) {
    return sendJson(res, 404, { ok: false, message: 'Không tìm thấy tài liệu.' });
  }

  const result = await getBlob(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200) {
    return sendJson(res, 404, { ok: false, message: 'File không còn tồn tại trên máy chủ.' });
  }

  const originalName = clean(item.original_name, 180) || clean(result.blob?.pathname, 180).split('/').pop() || 'tai-lieu';
  const mime = result.blob?.contentType || clean(item.mime, 120) || 'application/octet-stream';
  const size = Number(result.blob?.size || item.size || 0);

  res.statusCode = 200;
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  if (Number.isFinite(size) && size > 0) res.setHeader('Content-Length', String(size));
  if (result.blob?.etag) res.setHeader('ETag', result.blob.etag);

  for await (const chunk of result.stream) res.write(Buffer.from(chunk));
  return res.end();
}

async function lessonStatus(req,res){
  const u=new URL(req.url,'http://localhost'); const key=clean(u.searchParams.get('lessonKey'),180); const download=u.searchParams.get('download')==='1';
  if(!validLessonKey(key)) return sendJson(res,400,{ok:false,message:'lessonKey không hợp lệ.'});
  const redis=getRedis(); let rec=await redis.get(`phuc:lesson-pdf:${key}`); if(typeof rec==='string'){try{rec=JSON.parse(rec)}catch{rec=null}}
  if(!rec) return sendJson(res,200,{ok:true,available:false,lessonKey:key});
  if(!download) return sendJson(res,200,{ok:true,available:true,lessonKey:key,pdf:{original_name:rec.original_name,size:rec.size,size_label:rec.size_label,updated_at:rec.updated_at}});
  const session=await getSession(req); if(!session)return sendJson(res,401,{ok:false,message:'Đăng nhập để mở PDF.'});
  const result=await getBlob(rec.pathname,{access:'private'});
  if(!result || result.statusCode!==200) return sendJson(res,404,{ok:false,message:'Không tìm thấy PDF bài giảng.'});
  res.statusCode=200;
  res.setHeader('Content-Type',result.blob.contentType||'application/pdf');
  res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(rec.original_name||'bai-giang.pdf')}`);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','private, no-cache');
  if(result.blob.etag)res.setHeader('ETag',result.blob.etag);
  for await (const chunk of result.stream) res.write(Buffer.from(chunk));
  return res.end();
}

module.exports = async function handler(req,res){
  try{
    // Synchronous finalization path for lesson PDFs.
    // The client upload itself goes through Vercel Blob's secure token flow,
    // then explicitly asks this API to register the uploaded blob in Redis.
    // This avoids relying on the asynchronous onUploadCompleted callback.
    if(req.method==='POST'){
      const u = new URL(req.url,'http://localhost');
      if(u.searchParams.get('action')==='finalize-lesson-pdf'){
        const session=await getSession(req);
        if(!session)return sendJson(res,401,{ok:false,message:'Bạn cần đăng nhập trước khi gắn PDF bài giảng.'});
        if(!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin mới được gắn PDF bài giảng.'});
        const body=parseJsonBody(req);
        if(String(body?.kind||'')!=='lesson-pdf')return sendJson(res,400,{ok:false,message:'Yêu cầu finalization không hợp lệ.'});
        if(String(body?.csrf||'')!==String(session.csrf||''))return sendJson(res,403,{ok:false,message:'CSRF token không hợp lệ.'});
        const key=clean(body?.lessonKey,180);
        if(!validLessonKey(key))return sendJson(res,400,{ok:false,message:'Mã bài giảng không hợp lệ.'});
        const pathname=clean(body?.pathname,500);
        if(!pathname.startsWith('lesson-pdfs/') || pathname.includes('..') || pathname.includes('\\') || /[\r\n]/.test(pathname))
          return sendJson(res,400,{ok:false,message:'Đường dẫn Blob không hợp lệ.'});
        const filename=clean(body?.original_name,180)||'bai-giang.pdf';
        if(extOf(filename)!=='pdf')return sendJson(res,400,{ok:false,message:'Chỉ cho phép PDF.'});
        const mime=clean(body?.mime,120)||'application/pdf';
        if(mime!=='application/pdf')return sendJson(res,400,{ok:false,message:'MIME PDF không hợp lệ.'});

        // Verify the private blob really exists before registering it.
        const result=await getBlob(pathname,{access:'private'});
        if(!result || result.statusCode!==200)return sendJson(res,404,{ok:false,message:'Không xác minh được file PDF vừa tải lên.'});

        const redis=getRedis();
        const oldRaw=await redis.get(`phuc:lesson-pdf:${key}`);
        let old=null;
        if(oldRaw){try{old=typeof oldRaw==='string'?JSON.parse(oldRaw):oldRaw}catch{old=null}}
        const bytes=Number(result.blob?.size||body?.size||0);
        const sizeLabel=bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;
        const now=new Date().toISOString();
        const user=await getUserByUsername(session.username);
        const item={
          lessonKey:key,
          lessonTitle:clean(body?.lessonTitle,240),
          original_name:filename,
          mime:'application/pdf',
          size:bytes,
          size_label:sizeLabel,
          pathname,
          url:clean(body?.url,1200)||result.blob?.url||'',
          updated_at:now,
          updated_by:user?.display_name||session.username
        };
        await redis.set(`phuc:lesson-pdf:${key}`,JSON.stringify(item));
        if(old?.pathname && old.pathname!==pathname){try{await delBlob(old.pathname,{access:'private'})}catch(e){console.warn('lesson old blob delete failed',e?.message)}}
        return sendJson(res,200,{ok:true,available:true,lessonKey:key,pdf:{original_name:item.original_name,size:item.size,size_label:item.size_label,updated_at:item.updated_at}});
      }
    }

    if(req.method==='GET'){
      const u = new URL(req.url,'http://localhost');
      const kind = String(u.searchParams.get('kind') || '');
      if(kind==='lesson-pdf') return lessonStatus(req,res);
      if(kind==='student-library' && u.searchParams.get('download')==='1') return studentLibraryDownload(req,res);
    }
    if(req.method!=='POST') return sendJson(res,405,{ok:false,message:'Blob endpoint chỉ nhận POST.'});
    const session=await getSession(req); if(!session)return sendJson(res,401,{ok:false,message:'Bạn cần đăng nhập trước khi upload.'});
    const body=parseJsonBody(req); const requestedKind=clean(body?.kind,40)||'student-library';
    if(requestedKind==='lesson-pdf' && !isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin mới được upload PDF bài giảng.'});
    const response=await handleUpload({
      request:req, body,
      onBeforeGenerateToken:async(pathname,clientPayload)=>{
        const payload=clientPayload?JSON.parse(clientPayload):{};
        const user=await getUserByUsername(session.username); if(!user)throw new Error('Không tìm thấy tài khoản.');
        if(String(payload.csrf||'')!==String(session.csrf||''))throw new Error('CSRF token không hợp lệ.');
        const filename=clean(payload.original_name,180); const ext=extOf(filename); const mime=clean(payload.mime,120)||'application/octet-stream';
        if(requestedKind==='lesson-pdf' || payload.kind==='lesson-pdf'){
          if(!isAdmin(session.username))throw new Error('Chỉ admin mới được upload PDF bài giảng.');
          if(!validLessonKey(payload.lessonKey))throw new Error('Mã bài giảng không hợp lệ.');
          if(ext!=='pdf'||mime!=='application/pdf')throw new Error('Chỉ cho phép PDF.');
          return {allowedContentTypes:['application/pdf'],maximumSizeInBytes:25*1024*1024,addRandomSuffix:true,tokenPayload:JSON.stringify({kind:'lesson-pdf',username:session.username,lessonKey:clean(payload.lessonKey,180),lessonTitle:clean(payload.lessonTitle,240),original_name:filename,mime:'application/pdf',csrf:session.csrf})};
        }
        if(!ALLOWED_EXT.has(ext))throw new Error('Định dạng file không được phép.');
        if(!ALLOWED_MIME.has(mime))throw new Error('MIME file không được phép.');
        return {allowedContentTypes:Array.from(ALLOWED_MIME),maximumSizeInBytes:25*1024*1024,addRandomSuffix:true,tokenPayload:JSON.stringify({kind:'student-library',username:session.username,title:clean(payload.title,180),subject:clean(payload.subject,60),grade:clean(payload.grade,20),source:clean(payload.source,250),note:clean(payload.note,800),original_name:filename,mime,csrf:session.csrf})};
      },
      onUploadCompleted:async({blob,tokenPayload})=>{
        const meta=JSON.parse(tokenPayload||'{}'); const redis=getRedis();
        if(meta.kind==='lesson-pdf'){
          const user=await getUserByUsername(meta.username); if(!user||!isAdmin(meta.username))throw new Error('Không xác minh được quyền admin.');
          const key=meta.lessonKey; const oldRaw=await redis.get(`phuc:lesson-pdf:${key}`); let old=null; if(oldRaw){try{old=typeof oldRaw==='string'?JSON.parse(oldRaw):oldRaw}catch{}}
          const bytes=Number(blob.size||0); const sizeLabel=bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`; const now=new Date().toISOString();
          const item={lessonKey:key,lessonTitle:meta.lessonTitle,original_name:meta.original_name,mime:'application/pdf',size:bytes,size_label:sizeLabel,pathname:blob.pathname,url:blob.url,updated_at:now,updated_by:user.display_name||user.username};
          await redis.set(`phuc:lesson-pdf:${key}`,JSON.stringify(item));
          if(old?.pathname && old.pathname!==blob.pathname){try{await delBlob(old.pathname,{access:'private'})}catch(e){console.warn('lesson old blob delete failed',e?.message)}}
          return;
        }
        const user=await getUserByUsername(meta.username); if(!user)throw new Error('Không xác minh được người upload.');
        const id=await redis.incr('phuc:student-library:next-id'); const created=new Date().toISOString(); const bytes=Number(blob.size||0); const sizeLabel=bytes<1024*1024?`${Math.max(1,Math.round(bytes/1024))} KB`:`${(bytes/(1024*1024)).toFixed(1)} MB`;
        const item={id,title:meta.title,subject:meta.subject,grade:meta.grade,source:meta.source,note:meta.note,uploader:user.display_name||user.username,original_name:meta.original_name,mime:meta.mime,size:bytes,size_label:sizeLabel,created_label:new Date(created).toLocaleDateString('vi-VN'),created_at:created,download_url:blob.downloadUrl||blob.url,url:blob.url,pathname:blob.pathname};
        await redis.lpush('phuc:student-library',JSON.stringify(item));
      }
    });
    return sendJson(res,200,response);
  }catch(err){console.error('blob-api',err);return sendJson(res,400,{ok:false,message:err?.message||'Không thể chuẩn bị upload Blob.'});}
};
