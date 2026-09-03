const { getRedis } = require('../lib/redis');
const { USER_PREFIX, getSession, getCsrf, requireCsrf, sendJson, parseCookies, setCookie } = require('../lib/auth');
const crypto = require('crypto');

const ATTEMPTS_KEY = 'phuc:exam-attempts';
const MAX_ATTEMPTS = 5000;
function isAdmin(username) {
  return String(process.env.ADMIN_USERNAME || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(String(username || '').trim().toLowerCase());
}
function clean(s, max=140){ return String(s||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,max); }
function gradeLabel(subject){ if(String(subject).startsWith('k11')) return '2K11'; if(String(subject).startsWith('g10')) return '2K12'; return '2K9'; }
function normScore(n){ const x=Number(n); return Number.isFinite(x)?Math.max(0,Math.min(10,x)):0; }
function todayStart(){const d=new Date();d.setHours(0,0,0,0);return d.getTime();}
function vnDayKey(d=new Date()){
  const x=new Date(d.getTime()+7*60*60*1000);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
}
function visitorCookieOptions(maxAge=60*60*24*365){return {httpOnly:false,maxAge,sameSite:'lax',secure:true,path:'/'};}
function validVisitorId(v){return /^[a-f0-9-]{24,80}$/i.test(String(v||''));}
async function trackVisitor(req,res,redis){
  const cookies=parseCookies(req); let vid=String(cookies.phuc_visitor||'');
  if(!validVisitorId(vid)){vid=crypto.randomUUID();setCookie(res,'phuc_visitor',vid,visitorCookieOptions());}
  const day=vnDayKey(); const month=day.slice(0,7);
  try{
    await redis.sadd('phuc:visitors:all',vid);
    await redis.sadd(`phuc:visitors:day:${day}`,vid);
    await redis.expire?.(`phuc:visitors:day:${day}`,60*60*24*45);
    await redis.sadd(`phuc:visitors:month:${month}`,vid);
    await redis.expire?.(`phuc:visitors:month:${month}`,60*60*24*400);
  }catch(e){console.error('visitor-track',e);}
  return vid;
}
async function uniqueWindow(redis,days){
  const ids=new Set(); const now=new Date();
  for(let i=0;i<days;i++){
    const d=new Date(now.getTime()-i*86400000); const key=`phuc:visitors:day:${vnDayKey(d)}`;
    try{const vals=await redis.smembers(key); if(Array.isArray(vals)) for(const v of vals) ids.add(String(v));}
    catch(e){break;}
  }
  return ids.size;
}

async function listAttempts(redis){
  let raw=[];
  try { raw = await redis.lrange(ATTEMPTS_KEY, 0, MAX_ATTEMPTS-1); } catch { raw=[]; }
  return raw.map(x=>{try{return typeof x==='string'?JSON.parse(x):x}catch{return null}}).filter(Boolean);
}

module.exports = async function handler(req,res){
  try {
    const action=String(req.query?.action||'overview').toLowerCase();
    const redis=getRedis();
    const session=await getSession(req);

    if(action==='track-visitor' && (req.method==='POST' || req.method==='GET')){
      await trackVisitor(req,res,redis);
      return sendJson(res,204,{ok:true});
    }

    if(action==='leaderboard' && req.method==='GET'){
      const attempts=await listAttempts(redis);
      const map=new Map();
      for(const a of attempts){
        const u=a.username; if(!u) continue;
        const cur=map.get(u)||{username:u,display_name:clean(a.display_name,50)||u,attempts:0,totalScore:0,bestScore:0,totalCorrect:0,totalQuestions:0,updatedAt:a.created_at||''};
        cur.attempts += 1; cur.totalScore += normScore(a.score); cur.bestScore=Math.max(cur.bestScore,normScore(a.score)); cur.totalCorrect += Number(a.correct||0); cur.totalQuestions += Number(a.total_questions||0); if((a.created_at||'')>cur.updatedAt)cur.updatedAt=a.created_at;
        map.set(u,cur);
      }
      const rows=[...map.values()].map(x=>({...x,avgScore:x.attempts?Math.round(x.totalScore/x.attempts*10)/10:0,accuracy:x.totalQuestions?Math.round(x.totalCorrect/x.totalQuestions*100):0,xp:Math.round(x.totalScore*10)+x.attempts*5})).sort((a,b)=>b.xp-a.xp||b.bestScore-a.bestScore||b.accuracy-a.accuracy).slice(0,50);
      return sendJson(res,200,{ok:true,leaderboard:rows});
    }

    if(action==='record-exam' && req.method==='POST'){
      if(!session) return sendJson(res,401,{ok:false,message:'Hãy đăng nhập để lưu kết quả và vào bảng xếp hạng.'});
      const csrf=session.csrf||await getCsrf(req,res);
      if(!requireCsrf(req,session,csrf)) return sendJson(res,403,{ok:false,message:'CSRF token không hợp lệ.',csrf});
      let body=req.body||{}; if(typeof body==='string'){try{body=JSON.parse(body||'{}')}catch{body={}}}
      const review=Array.isArray(body.review)?body.review.slice(0,60):[];
      const score=normScore(body.score); const subject=clean(body.subject,40); const examId=clean(body.exam_id,100); const title=clean(body.title,180);
      const attempt={username:session.username,display_name:clean(body.display_name,80),exam_id:examId,title,subject,grade:gradeLabel(subject),score,correct:Number(body.correct||0)||0,total_questions:Number(body.total_questions||0)||0,created_at:new Date().toISOString(),sections:body.sections&&typeof body.sections==='object'?body.sections:{},review};
      await redis.lpush(ATTEMPTS_KEY,JSON.stringify(attempt));
      try{await redis.ltrim(ATTEMPTS_KEY,0,MAX_ATTEMPTS-1)}catch{}
      return sendJson(res,200,{ok:true,saved:true});
    }

    if(action==='my-results' && req.method==='GET'){
      if(!session) return sendJson(res,401,{ok:false,message:'Chưa đăng nhập.'});
      const attempts=(await listAttempts(redis)).filter(a=>a.username===session.username).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,50);
      return sendJson(res,200,{ok:true,attempts});
    }

    if(action==='overview' && req.method==='GET'){
      if(!session || !isAdmin(session.username)) return sendJson(res,403,{ok:false,message:'Không có quyền quản trị.'});
      let cursor=0,users=0,activeToday=0;const start=todayStart();
      do{const scan=await redis.scan(cursor,{match:`${USER_PREFIX}*`,count:100});cursor=Number(scan?.[0]??0);const keys=Array.isArray(scan?.[1])?scan[1]:[];if(keys.length){const vals=await Promise.all(keys.map(k=>redis.get(k).catch(()=>null)));vals.forEach(u=>{if(!u)return;users++;if(u.last_active&&new Date(u.last_active).getTime()>=start)activeToday++;});}}while(cursor!==0);
      let uploads=0;try{uploads=Number(await redis.llen('phuc:student-library'))||0}catch{}
      const attempts=await listAttempts(redis);
      let visitorsAll=0,visitorsToday=0,visitors7d=0,visitors30d=0;
      try{visitorsAll=Number(await redis.scard('phuc:visitors:all'))||0}catch{}
      try{visitorsToday=Number(await redis.scard(`phuc:visitors:day:${vnDayKey()}`))||0}catch{}
      try{visitors7d=await uniqueWindow(redis,7)}catch{}
      try{visitors30d=await uniqueWindow(redis,30)}catch{}
      return sendJson(res,200,{ok:true,stats:{users,uploads,exam_attempts:attempts.length,today:activeToday,unique_visitors:visitorsAll,unique_today:visitorsToday,unique_7d:visitors7d,unique_30d:visitors30d}});
    }

    return sendJson(res,400,{ok:false,message:'Hành động không hợp lệ.'});
  }catch(err){console.error('dashboard-api',err);return sendJson(res,500,{ok:false,message:'Không thể xử lý dashboard.'});}
};
