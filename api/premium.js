const { getRedis } = require('../lib/redis');
const { USER_PREFIX, getSession, getCsrf, requireCsrf, sendJson } = require('../lib/auth');

function adminUser(username){
  const raw=String(process.env.ADMIN_USERNAME||process.env.ADMINUSER||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  return raw.includes(String(username||'').trim().toLowerCase());
}
function cleanName(v){return String(v||'').trim().replace(/\s+/g,' ').slice(0,80)}
function nowIso(){return new Date().toISOString()}

module.exports = async function handler(req,res){
  try{
    const action=String(req.query?.action||'status').toLowerCase();
    const redis=getRedis();
    const session=await getSession(req);
    const csrf=session?.csrf||await getCsrf(req,res);
    const username=session?.username||'';

    if(action==='status' && req.method==='GET'){
      if(!session) return sendJson(res,200,{ok:true,authenticated:false,premium:false,pending:false,request:null});
      const user=await redis.get(`${USER_PREFIX}${username}`);
      const request=await redis.get(`phuc:premium:req:${username}`);
      const premium=!!(user?.premium?.active && user?.premium?.plan==='premium_plus');
      return sendJson(res,200,{ok:true,authenticated:true,premium,pending:!!(request?.status==='pending'),request:request||null});
    }

    if(!session) return sendJson(res,401,{ok:false,message:'Hãy đăng nhập tài khoản trước.',csrf});
    if(!requireCsrf(req,session,csrf)) return sendJson(res,403,{ok:false,message:'CSRF token không hợp lệ.',csrf});

    let body=req.body||{}; if(typeof body==='string'){try{body=JSON.parse(body||'{}')}catch{body={}}}

    if(action==='request' && req.method==='POST'){
      const user=await redis.get(`${USER_PREFIX}${username}`);
      if(!user) return sendJson(res,404,{ok:false,message:'Không tìm thấy tài khoản.',csrf});
      if(user?.premium?.active) return sendJson(res,409,{ok:false,message:'Tài khoản đã là Premium+.',csrf});
      const student_name=cleanName(body.student_name||user.display_name);
      const payment_content=cleanName(body.payment_content);
      if(student_name.length<2) return sendJson(res,422,{ok:false,message:'Tên học viên không hợp lệ.',csrf});
      const expected=`${student_name} + premium`;
      if(payment_content!==expected) return sendJson(res,422,{ok:false,message:'Nội dung chuyển khoản phải đúng dạng: Tên học viên + premium.',csrf});
      const old=await redis.get(`phuc:premium:req:${username}`);
      if(old?.status==='pending') return sendJson(res,409,{ok:false,message:'Yêu cầu Premium đang chờ xét duyệt.',csrf});
      const rec={username,display_name:cleanName(user.display_name||username),student_name,payment_content,status:'pending',created_at:nowIso()};
      await redis.set(`phuc:premium:req:${username}`,rec,{ex:60*60*24*90});
      return sendJson(res,200,{ok:true,request:rec,csrf});
    }

    if(action==='admin-list' && req.method==='GET'){
      if(!adminUser(username)) return sendJson(res,403,{ok:false,message:'Không có quyền admin.',csrf});
      const rows=[]; let cursor=0;
      do{
        const scan=await redis.scan(cursor,{match:'phuc:premium:req:*',count:100});
        cursor=Number(scan?.[0]??0);
        const keys=Array.isArray(scan?.[1])?scan[1]:[];
        if(keys.length){
          const vals=await Promise.all(keys.map(k=>redis.get(k).catch(()=>null)));
          vals.forEach(v=>{if(v?.status==='pending')rows.push(v)});
        }
      }while(cursor!==0);
      rows.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
      return sendJson(res,200,{ok:true,requests:rows,csrf});
    }

    if(action==='admin-set' && req.method==='POST'){
      if(!adminUser(username)) return sendJson(res,403,{ok:false,message:'Không có quyền admin.',csrf});
      const target=cleanName(body.username).toLowerCase();
      if(!target) return sendJson(res,422,{ok:false,message:'Thiếu username.',csrf});
      const user=await redis.get(`${USER_PREFIX}${target}`);
      if(!user) return sendJson(res,404,{ok:false,message:'Không tìm thấy tài khoản cần kích hoạt.',csrf});
      user.premium={plan:'premium_plus',active:true,activated_at:nowIso(),approved_by:username};
      await redis.set(`${USER_PREFIX}${target}`,user);
      const reqRec=await redis.get(`phuc:premium:req:${target}`);
      if(reqRec){reqRec.status='approved';reqRec.approved_at=nowIso();reqRec.approved_by=username;await redis.set(`phuc:premium:req:${target}`,reqRec,{ex:60*60*24*90});}
      return sendJson(res,200,{ok:true,premium:user.premium,username:target,csrf});
    }

    return sendJson(res,400,{ok:false,message:'Hành động không hợp lệ.',csrf});
  }catch(e){
    console.error('premium api',e);
    return sendJson(res,500,{ok:false,message:'Lỗi máy chủ Premium.',detail:process.env.NODE_ENV==='development'?String(e.message||e):undefined});
  }
}
