const {getRedis}=require('../lib/redis');
const {getSession,getUserByUsername,sendJson}=require('../lib/auth');
const {get: getBlob}=require('@vercel/blob');
const {normalizeScoring,questionNeedsReview,validateExamStructure,safeQuestionImageUrl}=require('../lib/exam-utils');
const crypto=require('crypto');
const ATTEMPT_TTL_SECONDS=60*60*24*400;
const SEED=require('../lib/seed-exams');
const key=(...p)=>'phuc:exam:'+p.join(':');
const clean=(v,max=400)=>String(v??'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,max);
function admins(){return String(process.env.ADMIN_USERNAME||process.env.ADMINUSER||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)}
function isAdmin(u){return admins().includes(String(u||'').trim().toLowerCase())}
function csrfOk(req,session){return !!session?.csrf && String(req.headers['x-csrf-token']||'')===String(session.csrf)}
function parseBody(req){
  // Vercel Functions normally parses application/json into req.body before invoking this handler.
  if(req && req.body!==undefined){
    if(typeof req.body==='string'){if(Buffer.byteLength(req.body,'utf8')>3e6) return Promise.reject(new Error('Payload quá lớn')); try{return Promise.resolve(JSON.parse(req.body||'{}'))}catch{return Promise.reject(new Error('JSON không hợp lệ'))}}
    if(req.body && typeof req.body==='object'){if(Buffer.byteLength(JSON.stringify(req.body),'utf8')>3e6)return Promise.reject(new Error('Payload quá lớn'));return Promise.resolve(req.body)}
    return Promise.resolve({});
  }
  return new Promise((resolve,reject)=>{let s='',done=false;req.on('data',c=>{if(done)return;s+=c;if(Buffer.byteLength(s,'utf8')>3e6){done=true;reject(new Error('Payload quá lớn'))}});req.on('end',()=>{if(done)return;try{resolve(s?JSON.parse(s):{})}catch{reject(new Error('JSON không hợp lệ'))}});req.on('error',e=>{if(!done)reject(e)})});
}
async function redisJsonGet(r,k){let x=await r.get(k);if(typeof x==='string'){try{x=JSON.parse(x)}catch{x=null}}return x||null}
function publicExam(e){e=normalizeExamMeta(e); return {id:e.id,title:e.title,subject:e.subject,grade:e.grade,program:e.program,year:e.year,examType:e.examType,examPeriod:e.examPeriod,semester:e.semester,examSession:e.examSession,periodLabel:e.periodLabel,source:e.source,sourceFile:e.sourceFile,duration:e.duration,scoring:e.scoring,questions:(e.questions||[]).map(q=>{const x={id:q.id,section:q.section,type:q.type,number:q.number,text:q.text,sourcePage:q.sourcePage,table:q.table,reviewRequired:!!q.reviewRequired}; if(q.imageUrl && safeQuestionImageUrl(q.imageUrl)){x.imageUrl=q.imageUrl;x.imageAlt=String(q.imageAlt||'Hình minh họa câu hỏi').slice(0,300)} if(q.type==='mcq')x.options=q.options; if(q.type==='truefalse')x.statements=q.statements.map(s=>({text:s.text})); if(q.type==='short')x.input=true; return x;})}}
function adminExam(e){return e}
function norm(v){
  let s=String(v??'').normalize('NFKC').trim().toLowerCase().replace(/,/g,'.').replace(/\s+/g,'');
  // Strip units only when the remainder is a numeric answer; do not damage words ending in m/j/kg.
  const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
  const units=['nghìndồng','nghindong','triệuđồng','trieudong','đồng','dong','vnđ','vnd','km','cm','mm','kg','mg','g','ml','l','m²','m2','m³','m3','m','j','%'];
  for(const unit of units){if(s.endsWith(unit)){const base=s.slice(0,-unit.length);if(numeric.test(base)){s=base;break;}}}
  return s;
}
function eqShort(user,q){
  const u=norm(user); const vals=(q.acceptedAnswers||[q.answer]).map(norm);
  if(vals.includes(u)) return true;
  if(!u)return false;
  const un=Number(u); if(Number.isFinite(un)) return vals.some(v=>{const n=Number(v);return Number.isFinite(n)&&Math.abs(un-n)<=1e-9});
  return false;
}
function sanitizeAnswers(exam,answers){
  const src=answers&&typeof answers==='object'&&!Array.isArray(answers)?answers:{}; const out={};
  for(const q of exam.questions||[]){
    if(!Object.prototype.hasOwnProperty.call(src,q.id)) continue;
    const a=src[q.id];
    if(q.type==='mcq'){
      const v=String(a??'').trim().toUpperCase();
      if(/^[A-Z]$/.test(v)) out[q.id]=v;
    }else if(q.type==='truefalse'){
      const arr=Array.isArray(a)?a:[];
      out[q.id]=arr.slice(0,Array.isArray(q.statements)?q.statements.length:0).map(v=>v===true||v==='true'||v===1||v==='1'?true:(v===false||v==='false'||v===0||v==='0'?false:null));
    }else if(q.type==='short'){
      const v=String(a??'').trim();
      if(v.length<=200) out[q.id]=v;
    }
  }
  return out;
}
function maxRawScore(exam){
  const sc=normalizeScoring(exam); let max=0;
  for(const q of exam.questions||[]){
    if(q.type==='mcq') max+=Number(sc.mcq??.25);
    else if(q.type==='truefalse'){const arr=Array.isArray(sc.tf)?sc.tf:[0,.1,.25,.5,1];max+=Number(arr[arr.length-1]||0);}
    else if(q.type==='short') max+=Number(sc.short??.25);
  }
  return Number(max.toFixed(4));
}
function grade(exam,answers){
  answers=sanitizeAnswers(exam,answers);
  let score=0,correct=0,total=0; const review=[]; const sc=normalizeScoring(exam);
  for(const q of exam.questions||[]){ total++; const a=answers?.[q.id]; let pts=0,ok=false,detail=null;
    if(q.type==='mcq'){ok=String(a??'').trim().toUpperCase()===String(q.answer??'').trim().toUpperCase(); if(ok)pts=Number(sc.mcq??.25);}
    else if(q.type==='truefalse'){const arr=Array.isArray(a)?a:[]; let c=0; detail=[]; for(let i=0;i<q.statements.length;i++){const got=arr[i]; const yes=(got===true||got==='true'||got===1||got==='1'); const no=(got===false||got==='false'||got===0||got==='0'); const v=yes?true:no?false:null; const item=q.statements[i]; const one=v!==null&&v===!!item.answer; if(one)c++; detail.push({index:i,correct:one});} pts=Number(sc.tf[Math.min(c,sc.tf.length-1)]||0); ok=c===q.statements.length;}
    else if(q.type==='short'){ok=eqShort(a,q); if(ok)pts=Number(sc.short??.25);}
    score+=pts; if(ok)correct++; review.push({id:q.id,number:q.number,section:q.section,type:q.type,userAnswer:a??null,points:pts,correct:ok,correctAnswer:q.type==='mcq'?q.answer:q.type==='short'?(q.acceptedAnswers||[q.answer]):q.statements.map(s=>!!s.answer),statements:detail,explanation:q.explanation||'',sourcePage:q.sourcePage,reviewRequired:!!q.reviewRequired});
  }
  const rawScore=Number(score.toFixed(2)); const maxScore=maxRawScore(exam);
  const score10=maxScore>0?Number((rawScore/maxScore*10).toFixed(2)):0;
  return {score:score10,rawScore,maxScore,correct,total,unanswered:Math.max(0,total-countAnswered(exam,answers)),review};
}
function countAnswered(exam,answers){let n=0;for(const q of exam.questions||[]){const a=answers?.[q.id];if(q.type==='truefalse'){if(Array.isArray(a)&&a.some(v=>v===true||v===false))n++;}else if(q.type==='short'){if(String(a??'').trim())n++;}else if(String(a??'').trim())n++;}return n;}
function normalizeExamMeta(e){e=JSON.parse(JSON.stringify(e||{}));e.program=e.program||((String(e.grade||'')==='12')?'2k9':'');e.subject=e.subject||'other';e.year=e.year||'';e.examType=e.examType||'other';e.examPeriod=e.examPeriod||'';e.semester=e.semester||'';e.examSession=e.examSession||'';e.periodLabel=e.periodLabel||([e.examType,e.semester,e.year].filter(Boolean).join(' • ')||'Kỳ thi khác');return e}
function applyKnownSeedCorrections(exam){
  const e=normalizeExamMeta(exam);
  for(const q of e.questions||[]){
    // Four true/false records in the bundled math seed swapped the explanation and source-page fields.
    if(typeof q.explanation==='number' && typeof q.sourcePage==='string' && q.sourcePage.length>60){const page=q.explanation;q.explanation=q.sourcePage;q.sourcePage=page;}
    // Backward-compatible correction for older Redis-stored copies of the bundled source.
    if(q.id==='math-2026-lamdong-p1-q2' && q.answer==='C' && Array.isArray(q.options) && q.options[1] && /-∫\[-1,1\].*\+∫\[1,5\]/.test(q.options[1]))q.answer='B';
  }
  return e;
}
async function getExam(r,id){let e=await redisJsonGet(r,key('def',id)); if(e)return applyKnownSeedCorrections(e); const seed=SEED.find(x=>x.id===id)||null; return seed?applyKnownSeedCorrections(seed):null}
async function appendHistoryOnce(r,username,row){const histKey=key('history',username);const hist=await redisJsonGet(r,histKey);const arr=Array.isArray(hist)?hist:[];if(!arr.some(x=>x&&x.attemptId===row.attemptId)){arr.unshift(row);await r.set(histKey,JSON.stringify(arr.slice(0,100)));}}
function historyRow(a){const r=a.result||{};return {attemptId:a.id,examId:a.exam?.id,title:a.exam?.title,subject:a.exam?.subject,score:r.score,rawScore:r.rawScore,maxScore:r.maxScore,correct:r.correct,total:r.total,submittedAt:a.submittedAt,expired:!!a.expired}}
async function handler(req,res){
  try{
    const u=new URL(req.url,'http://localhost'); const action=u.searchParams.get('action')||'list'; const r=getRedis();
    if(req.method==='GET'){
      if(action==='list'){
        const ids=new Set(SEED.map(x=>x.id));
        try{ for(const id of (await r.smembers('phuc:exam:index')||[])) ids.add(String(id)); }catch{}
        const out=[]; for(const id of ids){const x=await getExam(r,id); if(x?.published!==false && !(x.questions||[]).some(questionNeedsReview))out.push(publicExam(x));}
        return sendJson(res,200,{ok:true,exams:out});
      }
      const session=await getSession(req); const id=clean(u.searchParams.get('id'),200);
      if(action==='get'){const e=await getExam(r,id); if(!e||e.published===false||(e.questions||[]).some(questionNeedsReview))return sendJson(res,404,{ok:false,message:'Không tìm thấy đề đủ điều kiện công khai.'}); return sendJson(res,200,{ok:true,exam:publicExam(e)})}
      if(action==='admin-list'){
        if(!session||!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin.'});
        const ids=new Set(SEED.map(x=>x.id));
        try{ for(const id of (await r.smembers('phuc:exam:index')||[])) ids.add(String(id)); }catch{}
        const out=[]; for(const id of ids){const x=await getExam(r,id); if(x)out.push({id:x.id,title:x.title,program:x.program,subject:x.subject,grade:x.grade,year:x.year,examType:x.examType,periodLabel:x.periodLabel,source:x.source,sourceFile:x.sourceFile,sourceId:x.sourceId,duration:x.duration,questionCount:(x.questions||[]).length,published:x.published!==false,reviewCount:(x.questions||[]).filter(questionNeedsReview).length,updatedAt:x.updatedAt||x.createdAt||null});}
        out.sort((a,b)=>Number(b.updatedAt||0)-Number(a.updatedAt||0));
        return sendJson(res,200,{ok:true,exams:out});
      }
      if(action==='source-download'){
        if(!session)return sendJson(res,401,{ok:false,message:'Đăng nhập để xem nguồn đề.'});
        const sourceId=clean(u.searchParams.get('sourceId'),120);
        if(!/^[a-zA-Z0-9._:-]{1,120}$/.test(sourceId))return sendJson(res,400,{ok:false,message:'Nguồn đề không hợp lệ.'});
        const src=await redisJsonGet(r,`phuc:exam-source:${sourceId}`);
        if(!src?.pathname)return sendJson(res,404,{ok:false,message:'Không tìm thấy nguồn đề.'});
        const result=await getBlob(src.pathname,{access:'private'});
        if(!result||result.statusCode!==200)return sendJson(res,404,{ok:false,message:'File nguồn không còn tồn tại.'});
        res.statusCode=200; res.setHeader('Content-Type',result.blob?.contentType||src.mime||'application/octet-stream');
        res.setHeader('Content-Disposition',`inline; filename*=UTF-8''${encodeURIComponent(src.original_name||'nguon-de')}`); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('Cache-Control','private, no-store');
        if(result.blob?.etag)res.setHeader('ETag',result.blob.etag);
        for await(const chunk of result.stream)res.write(Buffer.from(chunk)); return res.end();
      }
      if(action==='admin-get'){if(!session||!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin.'}); const e=await getExam(r,id); if(!e)return sendJson(res,404,{ok:false,message:'Không tìm thấy đề.'}); return sendJson(res,200,{ok:true,exam:adminExam(e)})}
      if(action==='history'){if(!session)return sendJson(res,401,{ok:false,message:'Đăng nhập để xem lịch sử.'}); const idx=await redisJsonGet(r,key('history',session.username)); return sendJson(res,200,{ok:true,history:Array.isArray(idx)?idx:[]})}
      if(action==='resume'){if(!session)return sendJson(res,401,{ok:false,message:'Đăng nhập để khôi phục bài thi.'}); const attemptId=clean(u.searchParams.get('attempt'),200); const a=await redisJsonGet(r,key('attempt',attemptId)); if(!a||a.username!==session.username)return sendJson(res,404,{ok:false,message:'Không tìm thấy lượt thi.'}); if(a.submitted)return sendJson(res,200,{ok:true,submitted:true,result:a.result,exam:publicExam(a.exam),submittedAt:a.submittedAt}); return sendJson(res,200,{ok:true,submitted:false,attemptId:a.id,exam:publicExam(a.exam),savedAnswers:a.savedAnswers||{},startedAt:a.startedAt,expiresAt:a.expiresAt,lastSavedAt:a.lastSavedAt||null})}
      if(action==='result'){if(!session)return sendJson(res,401,{ok:false,message:'Đăng nhập để xem kết quả.'}); const attemptId=clean(u.searchParams.get('attempt'),200); const a=await redisJsonGet(r,key('attempt',attemptId)); if(!a||a.username!==session.username||!a.submitted)return sendJson(res,404,{ok:false,message:'Không tìm thấy kết quả.'}); return sendJson(res,200,{ok:true,result:a.result,exam:publicExam(a.exam),submittedAt:a.submittedAt})}
      if(action==='source'){const e=await getExam(r,id); if(!e)return sendJson(res,404,{ok:false}); if(e.published===false && (!session||!isAdmin(session.username)))return sendJson(res,404,{ok:false}); return sendJson(res,200,{ok:true,sourceFile:e.sourceFile})}
      return sendJson(res,400,{ok:false,message:'Action không hợp lệ.'});
    }
    if(req.method!=='POST')return sendJson(res,405,{ok:false,message:'Method không được hỗ trợ.'});
    const session=await getSession(req); if(!session)return sendJson(res,401,{ok:false,message:'Hãy đăng nhập tài khoản trước.'});
    const body=await parseBody(req); if(!csrfOk(req,session))return sendJson(res,403,{ok:false,message:'CSRF không hợp lệ.'});
    if(action==='admin-import'){
      if(!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin mới được nhập đề.'});
      let e=body.exam; if(!e||typeof e!=='object'||Array.isArray(e)||!e.id||!Array.isArray(e.questions)||!e.title)return sendJson(res,400,{ok:false,message:'Thiếu cấu trúc đề.'});
      const existing=await getExam(r,clean(e.id,120));
      e={...(existing||{}),...e};
      e=normalizeExamMeta(e); e.id=clean(e.id,120); e.title=clean(e.title,300); e.source=clean(e.source,300); e.sourceFile=clean(e.sourceFile||existing?.sourceFile,300); e.sourceId=clean(e.sourceId||existing?.sourceId,120); e.program=clean(e.program,40); e.subject=clean(e.subject,40); e.grade=clean(e.grade,20); e.year=clean(e.year,20); e.examType=clean(e.examType,60); e.examPeriod=clean(e.examPeriod,80); e.semester=clean(e.semester,40); e.examSession=clean(e.examSession,80); e.periodLabel=clean(e.periodLabel,120);
      const invalid=validateExamStructure(e); if(invalid)return sendJson(res,422,{ok:false,message:invalid});
      e.published=false; e.publishedAt=null; e.updatedAt=Date.now(); e.updatedBy=session.username;
      await r.set(key('def',e.id),JSON.stringify(e)); try{await r.sadd('phuc:exam:index',e.id)}catch{}
      return sendJson(res,200,{ok:true,message:'Đã lưu đề ở trạng thái nháp. Mặc định chưa publish.',exam:adminExam(e)});
    }
    if(action==='publish'){
      if(!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin.'}); const e=await getExam(r,body.id); if(!e)return sendJson(res,404,{ok:false,message:'Không tìm thấy đề.'});
      const invalid=validateExamStructure(e); if(invalid)return sendJson(res,422,{ok:false,message:invalid}); const needs=(e.questions||[]).filter(questionNeedsReview); if(needs.length)return sendJson(res,409,{ok:false,message:`Còn ${needs.length} câu cần rà soát đáp án/hình trước khi publish.`,questionIds:needs.map(q=>q.id)});
      e.published=true; e.publishedAt=Date.now(); e.updatedBy=session.username; await r.set(key('def',e.id),JSON.stringify(e)); return sendJson(res,200,{ok:true,exam:publicExam(e)});
    }
    if(action==='unpublish'){
      if(!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin.'});
      const e=await getExam(r,clean(body.id,200)); if(!e)return sendJson(res,404,{ok:false,message:'Không tìm thấy đề.'});
      e.published=false; e.publishedAt=null; e.updatedAt=Date.now(); e.updatedBy=session.username;
      await r.set(key('def',e.id),JSON.stringify(e)); await r.sadd('phuc:exam:index',e.id);
      return sendJson(res,200,{ok:true,message:'Đã ẩn đề khỏi kho học viên. Dữ liệu đề và lịch sử thi được giữ nguyên.',exam:{id:e.id,published:false}});
    }
    if(action==='start'){
      const e=await getExam(r,clean(body.id,200)); if(!e||e.published===false||(e.questions||[]).some(questionNeedsReview))return sendJson(res,404,{ok:false,message:'Đề chưa được phát hành hoặc còn câu cần Admin rà soát.'});
      const attemptId=crypto.randomUUID(); const now=Date.now(); const a={id:attemptId,username:session.username,exam:e,startedAt:now,expiresAt:now+Number(e.duration||60)*60000,savedAnswers:{},submitted:false}; await r.set(key('attempt',attemptId),JSON.stringify(a),{ex:ATTEMPT_TTL_SECONDS}); return sendJson(res,200,{ok:true,attemptId,exam:publicExam(e),startedAt:now,expiresAt:a.expiresAt});
    }
    if(action==='save'){
      const attemptId=clean(body.attemptId,200); const lockKey=key('attempt-lock',attemptId);
      const acquired=await r.set(lockKey,session.username,{nx:true,ex:15});
      if(!acquired)return sendJson(res,409,{ok:false,message:'Lượt thi đang được ghi nhận. Hãy thử lưu lại sau giây lát.'});
      try{
        const a=await redisJsonGet(r,key('attempt',attemptId)); if(!a||a.username!==session.username||a.submitted)return sendJson(res,404,{ok:false,message:'Phòng thi không còn hợp lệ.'});
        if(Date.now()>Number(a.expiresAt||0)) return sendJson(res,409,{ok:false,message:'Đã hết giờ làm bài. Hãy nộp phần đã lưu.'});
        a.savedAnswers=sanitizeAnswers(a.exam,body.answers); a.lastSavedAt=Date.now(); await r.set(key('attempt',a.id),JSON.stringify(a),{ex:ATTEMPT_TTL_SECONDS}); return sendJson(res,200,{ok:true,savedAt:a.lastSavedAt});
      }finally{try{await r.del(lockKey)}catch{}}
    }
    if(action==='submit'){
      const attemptId=clean(body.attemptId,200); const lockKey=key('attempt-lock',attemptId);
      const acquired=await r.set(lockKey,session.username,{nx:true,ex:30});
      if(!acquired){const latest=await redisJsonGet(r,key('attempt',attemptId));if(latest&&latest.username===session.username&&latest.submitted){await appendHistoryOnce(r,session.username,historyRow(latest));return sendJson(res,200,{ok:true,alreadySubmitted:true,result:latest.result})}return sendJson(res,409,{ok:false,message:'Đang nộp bài. Hãy chờ kết quả hoặc mở Lịch sử thi.'})}
      try{
        const a=await redisJsonGet(r,key('attempt',attemptId)); if(!a||a.username!==session.username)return sendJson(res,404,{ok:false,message:'Phòng thi không còn hợp lệ.'});
        if(a.submitted){await appendHistoryOnce(r,session.username,historyRow(a));return sendJson(res,200,{ok:true,alreadySubmitted:true,result:a.result})}
        const expired=Date.now()>Number(a.expiresAt||0);
        // After deadline, grade only the latest server-saved answers; a client cannot submit late edits.
        const supplied=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?body.answers:(a.savedAnswers||{});
        const answers=sanitizeAnswers(a.exam,expired?(a.savedAnswers||{}):supplied); const result=grade(a.exam,answers); a.savedAnswers=answers; a.submitted=true; a.expired=expired; a.submittedAt=Date.now(); a.result=result;
        await r.set(key('attempt',a.id),JSON.stringify(a),{ex:ATTEMPT_TTL_SECONDS});
        await appendHistoryOnce(r,session.username,historyRow(a));
        return sendJson(res,200,{ok:true,result,expired});
      }finally{try{await r.del(lockKey)}catch{}}
    }
    return sendJson(res,400,{ok:false,message:'Action không hợp lệ.'});
  }catch(err){
    console.error('EXAMS',err);
    if(err?.message==='JSON không hợp lệ')return sendJson(res,400,{ok:false,message:'JSON gửi lên không hợp lệ.'});
    if(err?.message==='Payload quá lớn')return sendJson(res,413,{ok:false,message:'Dữ liệu gửi lên quá lớn (tối đa 3 MB).'});
    if(err?.code==='REDIS_NOT_CONFIGURED')return sendJson(res,503,{ok:false,message:'Cơ sở dữ liệu chưa được cấu hình đầy đủ.'});
    return sendJson(res,500,{ok:false,message:'Lỗi máy chủ phòng luyện đề.'});
  }
}
module.exports=handler;
module.exports.getSeedExams=()=>SEED.map(applyKnownSeedCorrections);
