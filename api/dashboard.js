const { getRedis } = require('../lib/redis');
const { USER_PREFIX, getSession, sendJson } = require('../lib/auth');

function isAdmin(username) {
  return String(process.env.ADMIN_USERNAME || process.env.ADMINUSER || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(String(username || '').trim().toLowerCase());
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return sendJson(res, 405, { ok:false, message:'Dashboard chỉ nhận GET.' });
    const session = await getSession(req);
    if (!session || !isAdmin(session.username)) return sendJson(res, 403, { ok:false, message:'Không có quyền quản trị.' });
    const redis = getRedis();
    let cursor = 0, users = 0, activeToday = 0;
    const start = new Date(); start.setHours(0,0,0,0);
    do {
      const scan = await redis.scan(cursor, { match:`${USER_PREFIX}*`, count:100 });
      cursor = Number(scan?.[0] ?? 0);
      const keys = Array.isArray(scan?.[1]) ? scan[1] : [];
      if (keys.length) {
        const values = await Promise.all(keys.map(k => redis.get(k).catch(() => null)));
        values.forEach(u => { if (!u) return; users++; if (u.last_active && new Date(u.last_active) >= start) activeToday++; });
      }
    } while (cursor !== 0);
    let uploads = 0;
    try { uploads = Number(await redis.llen('phuc:student-library')) || 0; } catch {}
    return sendJson(res,200,{ok:true,stats:{users,uploads,today:activeToday,exam_attempts:null},notes:{exam_attempts:'Chưa lưu lượt làm đề server-side.'}});
  } catch (err) {
    console.error('dashboard-api',err);
    return sendJson(res,500,{ok:false,message:'Không thể tải số liệu quản trị.'});
  }
};
