const { getRedis } = require('../lib/redis');
const { USER_PREFIX, getSession, sendJson } = require('../lib/auth');

function isAdmin(username){
  const raw=String(process.env.ADMIN_USERNAME||process.env.ADMINUSER||'')
    .split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  return raw.includes(String(username||'').trim().toLowerCase());
}
function parseJson(v){
  if(v==null)return null;
  if(typeof v==='object')return v;
  try{return JSON.parse(v)}catch{return null}
}
function clean(v,max){return String(v??'').trim().slice(0,max)}
function vnDayKey(d=new Date()){
  const x=new Date(d.getTime()+7*60*60*1000);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
}
function daysAgo(n){return new Date(Date.now()-n*86400000)}
function shortDay(key){const p=String(key).split('-');return p.length===3?`${p[2]}/${p[1]}`:key}

async function scanValues(redis,pattern){
  const out=[]; let cursor=0;
  do{
    const scan=await redis.scan(cursor,{match:pattern,count:100});
    cursor=Number(scan?.[0]??0);
    const keys=Array.isArray(scan?.[1])?scan[1]:[];
    if(keys.length){
      const vals=await Promise.all(keys.map(k=>redis.get(k).catch(()=>null)));
      for(let i=0;i<keys.length;i++){
        const value=parseJson(vals[i]);
        if(value)out.push({key:String(keys[i]),value});
      }
    }
  }while(cursor!==0);
  return out;
}

async function collectIds(redis,startOffset,endOffset){
  const ids=new Set();
  for(let i=startOffset;i<=endOffset;i++){
    const key=`phuc:visitors:day:${vnDayKey(daysAgo(i))}`;
    try{
      const vals=await redis.smembers(key);
      if(Array.isArray(vals))for(const v of vals)ids.add(String(v));
    }catch{}
  }
  return ids;
}

async function uniqueDay(redis,offset){
  try{return Number(await redis.scard(`phuc:visitors:day:${vnDayKey(daysAgo(offset))}`))||0}catch{return 0}
}
async function pageviewsDay(redis,offset){
  try{return Number(await redis.get(`phuc:pageviews:day:${vnDayKey(daysAgo(offset))}`))||0}catch{return 0}
}
async function returningToday(redis){
  try{
    const today=await collectIds(redis,0,0);
    if(!today.size)return 0;
    const previous=await collectIds(redis,1,89);
    let n=0; for(const id of today)if(previous.has(id))n++;
    return n;
  }catch{return 0}
}
async function analytics(redis){
  const labels=[],daily=[];
  for(let i=6;i>=0;i--){
    const key=vnDayKey(daysAgo(i));
    labels.push(shortDay(key));
    daily.push({day:key,label:shortDay(key),unique:await uniqueDay(redis,i),pageviews:await pageviewsDay(redis,i)});
  }
  const uniqueToday=daily[daily.length-1]?.unique||0;
  const returning=await returningToday(redis);
  const newToday=Math.max(0,uniqueToday-returning);
  const returnRate=uniqueToday?Math.round(returning/uniqueToday*100):0;
  let unique7=0,unique30=0,online=0,pageviewsAll=0,pageviewsToday=0;
  try{unique7=(await collectIds(redis,0,6)).size}catch{}
  try{unique30=(await collectIds(redis,0,29)).size}catch{}
  try{pageviewsAll=Number(await redis.get('phuc:pageviews:all'))||0}catch{}
  try{pageviewsToday=Number(await redis.get(`phuc:pageviews:day:${vnDayKey()}`))||0}catch{}
  try{
    let cursor=0,count=0;
    do{
      const scan=await redis.scan(cursor,{match:'phuc:visitors:online:*',count:100});
      cursor=Number(scan?.[0]??0); count+=Array.isArray(scan?.[1])?scan[1].length:0;
    }while(cursor!==0);
    online=count;
  }catch{}
  return {labels,daily,uniqueToday,returningToday:returning,newToday,returnRate,unique7,unique30,pageviewsAll,pageviewsToday,online};
}

async function examStats(redis){
  const ids=new Set();
  try{(await redis.smembers('phuc:exam:index')||[]).forEach(id=>ids.add(String(id)))}catch{}
  const exams=[];
  for(const id of ids){
    const e=parseJson(await redis.get(`phuc:exam:def:${id}`).catch(()=>null));
    if(e)exams.push(e);
  }
  const published=exams.filter(e=>e.published!==false).length;
  const drafts=exams.filter(e=>e.published===false).length;
  const review=exams.filter(e=>(e.questions||[]).some(q=>q.answer==null||q.reviewRequired)).length;
  const recent=exams.sort((a,b)=>Number(b.updatedAt||b.createdAt||0)-Number(a.updatedAt||a.createdAt||0)).slice(0,8).map(e=>({
    id:e.id,title:e.title,program:e.program,subject:e.subject,grade:e.grade,year:e.year,
    examType:e.examType,periodLabel:e.periodLabel,source:e.source,questionCount:(e.questions||[]).length,
    published:e.published!==false,reviewCount:(e.questions||[]).filter(q=>q.answer==null||q.reviewRequired).length,
    updatedAt:e.updatedAt||e.createdAt||null
  }));
  return {total:exams.length,published,drafts,review,recent};
}

module.exports=async function handler(req,res){
  try{
    const session=await getSession(req);
    if(!session||!isAdmin(session.username))return sendJson(res,403,{ok:false,message:'Chỉ admin mới được truy cập.'});
    if(req.method!=='GET')return sendJson(res,405,{ok:false,message:'Chỉ hỗ trợ GET.'});
    const action=clean(new URL(req.url,'http://localhost').searchParams.get('action')||'overview',40);
    const redis=getRedis();

    if(action==='health'){
      const started=Date.now();
      return sendJson(res,200,{ok:true,health:{redis:true,latency_ms:Date.now()-started,checked_at:new Date().toISOString()}});
    }
    if(action!=='overview')return sendJson(res,400,{ok:false,message:'Action không hợp lệ.'});

    let users=0,activeToday=0;
    try{
      const start=Date.now(); const dayStart=new Date(); dayStart.setHours(0,0,0,0);
      let cursor=0;
      do{
        const scan=await redis.scan(cursor,{match:`${USER_PREFIX}*`,count:100}); cursor=Number(scan?.[0]??0);
        const keys=Array.isArray(scan?.[1])?scan[1]:[];
        if(keys.length){
          const vals=await Promise.all(keys.map(k=>redis.get(k).catch(()=>null)));
          for(const raw of vals){const u=parseJson(raw);if(!u)continue;users++;if(u.last_active&&new Date(u.last_active).getTime()>=dayStart.getTime())activeToday++;}
        }
      }while(cursor!==0);
      void start;
    }catch{}

    let uploads=0; try{uploads=Number(await redis.llen('phuc:student-library'))||0}catch{}
    let attempts=0; try{attempts=Number(await redis.llen('phuc:exam-attempts'))||0}catch{}
    const pdfs=await scanValues(redis,'phuc:lesson-pdf:*');
    const sources=await scanValues(redis,'phuc:exam-source:*');
    const ex=await examStats(redis);
    const a=await analytics(redis);

    const recentUsers=[];
    try{
      let cursor=0,rows=[];
      do{
        const scan=await redis.scan(cursor,{match:`${USER_PREFIX}*`,count:100}); cursor=Number(scan?.[0]??0);
        const keys=Array.isArray(scan?.[1])?scan[1]:[];
        if(keys.length){
          const vals=await Promise.all(keys.map(k=>redis.get(k).catch(()=>null)));
          for(const raw of vals){const u=parseJson(raw);if(u)rows.push(u)}
        }
      }while(cursor!==0);
      rows.sort((x,y)=>String(y.last_active||y.created_at||'').localeCompare(String(x.last_active||x.created_at||'')));
      rows.slice(0,8).forEach(u=>recentUsers.push({username:u.username,display_name:u.display_name,grade:u.settings?.preferred_grade||'2K9',streak:Number(u.streak||0),last_active:u.last_active||u.created_at||null}));
    }catch{}

    return sendJson(res,200,{ok:true,generatedAt:new Date().toISOString(),stats:{
      users,activeToday,uploads,attempts,
      uniqueAll:Number(await redis.scard('phuc:visitors:all').catch(()=>0))||0,
      uniqueToday:a.uniqueToday,unique7:a.unique7,unique30:a.unique30,
      returningToday:a.returningToday,newToday:a.newToday,returnRate:a.returnRate,
      pageviewsAll:a.pageviewsAll,pageviewsToday:a.pageviewsToday,online:a.online,
      exams:ex.total,examPublished:ex.published,examDrafts:ex.drafts,examReview:ex.review,
      lessonPdfs:pdfs.length,examSources:sources.length
    },analytics:a,exams:ex.recent,usersList:recentUsers,health:{redis:true,checkedAt:new Date().toISOString()}});
  }catch(err){
    console.error('admin-center',err);
    return sendJson(res,500,{ok:false,message:err?.message||'Không thể tải dashboard quản trị.'});
  }
};
