const { getRedis } = require('../lib/redis');
const {
  USER_PREFIX, parseCookies, clearCookie, setCookie, sendJson, normalizeUsername,
  validUsername, hashPassword, verifyPassword, safeUser, createSession, getSession,
  getCsrf, requireCsrf
} = require('../lib/auth');
const crypto = require('crypto');

function rateLimitKey(req, action) {
  const ip = String(req.headers?.['x-real-ip'] || req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const hashed = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
  return `phuc:auth:limit:${action}:${hashed}`;
}
async function allowAuthRequest(redis, req, action) {
  // Use broad IP buckets to slow scripted abuse without permanently locking individual accounts.
  const rules = action === 'register' ? [{max:10,seconds:60},{max:40,seconds:3600}] : [{max:30,seconds:60},{max:250,seconds:3600}];
  for (const rule of rules) {
    const bucket = Math.floor(Date.now() / (rule.seconds * 1000));
    const key = `${rateLimitKey(req, action)}:${rule.seconds}:${bucket}`;
    const count = Number(await redis.incr(key));
    if (count === 1) await redis.expire(key, rule.seconds + 5);
    if (count > rule.max) return false;
  }
  return true;
}

function adminUser(username) {
  const raw = String(process.env.ADMIN_USERNAME || process.env.ADMINUSER || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return raw.includes(String(username || '').trim().toLowerCase());
}
function dayKey(v){const d=v instanceof Date?v:new Date(v);return Number.isNaN(d.getTime())?null:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function updateStreak(user, now = new Date()) {
  const old = Math.max(1, Number(user.streak || 1));
  if (!user.last_active) return 1;
  const prev = new Date(user.last_active); if (Number.isNaN(prev.getTime())) return 1;
  const a=dayKey(prev),b=dayKey(now); if(!a||!b||a===b)return old;
  const start=new Date(prev.getFullYear(),prev.getMonth(),prev.getDate());
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const diff=Math.round((today-start)/86400000);
  return diff===1?old+1:diff>1?1:old;
}
async function touchUser(redis,user){
  const now=new Date(); const next=updateStreak(user,now);
  if(Number(user.streak||1)!==next || !user.last_active || dayKey(user.last_active)!==dayKey(now)){
    user.streak=next;user.last_active=now.toISOString();await redis.set(`${USER_PREFIX}${user.username}`,user);
  }
  return user;
}
function safeReturnTo(v){
  try{const u=new URL(String(v||'/')); if(u.origin===new URL(process.env.APP_ORIGIN||'https://thanhphuc.vercel.app').origin) return u.href;}catch{}
  return process.env.APP_ORIGIN||'https://thanhphuc.vercel.app/';
}

async function googleLinkStart(req,res,redis,session){
  const clientId=process.env.GOOGLE_CLIENT_ID; const clientSecret=process.env.GOOGLE_CLIENT_SECRET;
  if(!clientId||!clientSecret) return sendJson(res,503,{ok:false,message:'Google OAuth chưa được cấu hình. Thêm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET và GOOGLE_REDIRECT_URI trên Vercel.'});
  if(!session) return sendJson(res,401,{ok:false,message:'Hãy đăng nhập trước khi liên kết Google.'});
  const redirect=process.env.GOOGLE_REDIRECT_URI; if(!redirect) return sendJson(res,503,{ok:false,message:'Thiếu GOOGLE_REDIRECT_URI trên Vercel.'});
  const state=crypto.randomBytes(24).toString('hex');
  await redis.set(`phuc:google-state:${state}`,{username:session.username,created_at:Date.now(),return_to:safeReturnTo(req.query?.return_to)},{ex:600});
  const params=new URLSearchParams({client_id:clientId,redirect_uri:redirect,response_type:'code',scope:'openid email profile',state,access_type:'online',prompt:'select_account'});
  res.writeHead(302,{Location:`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`});res.end();
}
async function googleCallback(req,res,redis){
  const code=String(req.query?.code||'');const state=String(req.query?.state||'');
  if(!code||!state) return sendJson(res,400,{ok:false,message:'Google callback thiếu code/state.'});
  const rec=await redis.get(`phuc:google-state:${state}`); if(!rec) return sendJson(res,400,{ok:false,message:'Liên kết Google đã hết hạn. Hãy thử lại.'});
  await redis.del(`phuc:google-state:${state}`);
  const clientId=process.env.GOOGLE_CLIENT_ID,clientSecret=process.env.GOOGLE_CLIENT_SECRET,redirect=process.env.GOOGLE_REDIRECT_URI;
  if(!clientId||!clientSecret||!redirect) return sendJson(res,503,{ok:false,message:'Google OAuth chưa được cấu hình đầy đủ.'});
  const tokenResp=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:redirect,grant_type:'authorization_code'})});
  if(!tokenResp.ok) throw new Error('Google token exchange failed');
  const tok=await tokenResp.json();
  const profileResp=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${tok.access_token}`}});
  if(!profileResp.ok) throw new Error('Google userinfo failed');
  const gp=await profileResp.json();
  const user=await redis.get(`${USER_PREFIX}${rec.username}`); if(!user) return sendJson(res,404,{ok:false,message:'Không tìm thấy tài khoản.'});
  user.google={linked:true,sub:String(gp.sub||''),email:String(gp.email||'').slice(0,180),picture:String(gp.picture||'').slice(0,600)};
  if(!user.avatar_url && gp.picture) user.avatar_url=String(gp.picture).slice(0,600);
  user.last_active=new Date().toISOString(); await redis.set(`${USER_PREFIX}${user.username}`,user);
  const to=safeReturnTo(rec.return_to); res.writeHead(302,{Location:to+(to.includes('?')?'&':'?')+'google_linked=1'});res.end();
}

module.exports = async function handler(req,res){
  try{
    const action=String(req.query?.action||'me').toLowerCase();
    const redis=getRedis(); const session=await getSession(req); const csrf=session?.csrf||await getCsrf(req,res);
    if(action==='google-link' && req.method==='GET') return await googleLinkStart(req,res,redis,session);
    if(action==='google-callback' && req.method==='GET') return await googleCallback(req,res,redis);

    if(action==='me' && req.method==='GET'){
      if(!session)return sendJson(res,200,{ok:true,authenticated:false,user:null,csrf,is_admin:false});
      setCookie(res,'phuc_csrf',session.csrf||csrf,{httpOnly:false,maxAge:60*60*24*30});
      const user=await redis.get(`${USER_PREFIX}${session.username}`); if(!user)return sendJson(res,200,{ok:true,authenticated:false,user:null,csrf,is_admin:false});
      const fresh=await touchUser(redis,user);
      return sendJson(res,200,{ok:true,authenticated:true,user:safeUser(fresh),csrf:session.csrf||csrf,is_admin:adminUser(session.username)});
    }
    if(!['register','login','save-state','save-profile','logout'].includes(action))return sendJson(res,400,{ok:false,message:'Hành động không hợp lệ.'});
    if(req.method!=='POST')return sendJson(res,405,{ok:false,message:'API này chỉ nhận POST cho action này.'});
    if(['register','login'].includes(action)) {
      try { if(!await allowAuthRequest(redis,req,action))return sendJson(res,429,{ok:false,message:action==='register'?'Bạn đã gửi quá nhiều yêu cầu tạo tài khoản. Hãy thử lại sau.':'Bạn đã thử đăng nhập quá nhiều lần. Hãy thử lại sau.'},{'Retry-After':'60'}); }
      catch (rateErr) { console.error('auth-rate-limit',rateErr); return sendJson(res,503,{ok:false,message:'Hệ thống bảo vệ đăng nhập đang tạm thời không sẵn sàng. Vui lòng thử lại.'}); }
    }
    if(!['register','login'].includes(action)&&!requireCsrf(req,session,csrf))return sendJson(res,403,{ok:false,message:'CSRF token không hợp lệ.',csrf});
    let body=req.body||{}; if(typeof body==='string'){try{body=JSON.parse(body||'{}')}catch{body={}}}
    if(action==='register'){
      const username=normalizeUsername(body.username),displayName=String(body.display_name||'').trim(),password=String(body.password||'');
      if(!validUsername(username))return sendJson(res,422,{ok:false,message:'Tên đăng nhập không hợp lệ.'});
      if(displayName.length<2||displayName.length>80)return sendJson(res,422,{ok:false,message:'Họ và tên không hợp lệ.'});
      if(password.length<6||password.length>128)return sendJson(res,422,{ok:false,message:'Mật khẩu cần từ 6 đến 128 ký tự.'});
      const {salt,hash}=hashPassword(password),now=new Date().toISOString();
      const user={username,display_name:displayName,salt,password_hash:hash,created_at:now,last_active:now,streak:1,progress:{done:{},resume:null,notes:{}},settings:{preferred_grade:'2K9'},google:{linked:false,email:null},avatar_data:null,avatar_url:null};
      const created=await redis.set(`${USER_PREFIX}${username}`,user,{nx:true});if(!created)return sendJson(res,409,{ok:false,message:'Tên đăng nhập đã tồn tại.'});
      await createSession(res,username,csrf);return sendJson(res,200,{ok:true,authenticated:true,user:safeUser(user),csrf,is_admin:adminUser(username),message:'Tạo tài khoản thành công.'});
    }
    if(action==='login'){
      const username=normalizeUsername(body.username),password=String(body.password||'');const user=await redis.get(`${USER_PREFIX}${username}`);
      if(!user||!verifyPassword(password,user))return sendJson(res,401,{ok:false,message:'Tên đăng nhập hoặc mật khẩu không đúng.',csrf});
      user.streak=updateStreak(user,new Date());user.last_active=new Date().toISOString();await redis.set(`${USER_PREFIX}${username}`,user);await createSession(res,username,csrf);
      return sendJson(res,200,{ok:true,authenticated:true,user:safeUser(user),csrf,is_admin:adminUser(username),message:'Đăng nhập thành công.'});
    }
    if(action==='save-profile'){
      if(!session)return sendJson(res,401,{ok:false,message:'Phiên đăng nhập đã hết.',csrf});
      const user=await redis.get(`${USER_PREFIX}${session.username}`);if(!user)return sendJson(res,401,{ok:false,message:'Không tìm thấy tài khoản.',csrf});
      const displayName=String(body.display_name??user.display_name??'').trim(),preferred=String(body.preferred_grade??user.settings?.preferred_grade??'2K9').toUpperCase();
      if(displayName.length<2||displayName.length>80)return sendJson(res,422,{ok:false,message:'Tên hiển thị không hợp lệ.',csrf});
      if(!['2K9','2K11','2K12'].includes(preferred))return sendJson(res,422,{ok:false,message:'Khối ưu tiên không hợp lệ.',csrf});
      if(Object.prototype.hasOwnProperty.call(body,'avatar_data')){
        const a=String(body.avatar_data||'');
        if(a && (!/^data:image\/jpeg;base64,/.test(a) || a.length>220000))return sendJson(res,422,{ok:false,message:'Ảnh đại diện không hợp lệ hoặc quá lớn.',csrf});
        user.avatar_data=a||null;
      }
      user.display_name=displayName;user.settings={...(user.settings||{}),preferred_grade:preferred};user.last_active=new Date().toISOString();await redis.set(`${USER_PREFIX}${session.username}`,user);
      return sendJson(res,200,{ok:true,user:safeUser(user),csrf:session.csrf||csrf,is_admin:adminUser(session.username),message:'Đã lưu cài đặt tài khoản.'});
    }
    if(action==='save-state'){
      if(!session)return sendJson(res,401,{ok:false,message:'Phiên đăng nhập đã hết.',csrf});
      const user=await redis.get(`${USER_PREFIX}${session.username}`);if(!user)return sendJson(res,401,{ok:false,message:'Không tìm thấy tài khoản.',csrf});
      user.streak=updateStreak(user,new Date());user.last_active=new Date().toISOString();user.progress={done:body.done&&typeof body.done==='object'?body.done:{},resume:body.resume&&typeof body.resume==='object'?body.resume:null,notes:body.notes&&typeof body.notes==='object'?body.notes:{}};await redis.set(`${USER_PREFIX}${session.username}`,user);
      return sendJson(res,200,{ok:true,user:safeUser(user),csrf:session.csrf||csrf,is_admin:adminUser(session.username)});
    }
    if(action==='logout'){
      const cookies=parseCookies(req);if(cookies.phuc_session)await redis.del(`phuc:session:${cookies.phuc_session}`);clearCookie(res,'phuc_session');clearCookie(res,'phuc_csrf');return sendJson(res,200,{ok:true,authenticated:false,user:null,message:'Đã đăng xuất.'});
    }
    return sendJson(res,400,{ok:false,message:'Hành động không hợp lệ.'});
  }catch(err){console.error('auth-api',err);const status=err?.code==='REDIS_NOT_CONFIGURED'?503:500;return sendJson(res,status,{ok:false,message:status===503?err.message:'Lỗi máy chủ xác thực.'});}
};
