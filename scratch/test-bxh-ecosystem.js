'use strict';

const assert = require('assert');
const http = require('http');

const bxh = require('../lib/bxh-engine');
const rpg = require('../lib/rpg');
const arena = require('../lib/arena');
const { getRedis } = require('../lib/redis');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  ❌ ${name}\n     ${err.stack || err.message}`);
  }
}

function makeUser(username, overrides = {}) {
  const u = {
    username,
    display_name: overrides.display_name || username,
    xp: overrides.xp ?? 100,
    weekly_xp: 0,
    streak: overrides.streak ?? 1,
    settings: {
      preferred_grade: overrides.grade || '2K9',
      school: overrides.school || 'THPT Chuyên Khoa học Tự nhiên Hà Nội',
      ...(overrides.settings || {})
    },
    created_at: overrides.created_at || '2026-10-01T00:00:00.000Z',
    ...overrides
  };
  rpg.ensureUserRpgState(u, overrides.now || new Date('2026-11-16T03:00:00.000Z')); // Mon 10:00 VN
  return u;
}

// HTTP helper with cookie jar & CSRF tracking
function createHttpClient(baseUrl) {
  const cookies = new Map();
  let csrf = '';

  function cookieHeader() {
    return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  async function req(method, urlPath, body = null, extraHeaders = {}) {
    const headers = { ...extraHeaders };
    const ch = cookieHeader();
    if (ch) headers.Cookie = ch;
    if (csrf && method === 'POST') headers['x-csrf-token'] = csrf;
    let payload = null;
    if (body !== null) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    return await new Promise((resolve, reject) => {
      const u = new URL(urlPath, baseUrl);
      const r = http.request({
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers
      }, res => {
        const sc = res.headers['set-cookie'];
        if (Array.isArray(sc)) {
          for (const line of sc) {
            const pair = line.split(';')[0];
            const eq = pair.indexOf('=');
            if (eq > 0) {
              const k = pair.slice(0, eq).trim();
              const v = pair.slice(eq + 1).trim();
              if (!v) cookies.delete(k);
              else cookies.set(k, v);
              if (k === 'phuc_csrf' && v) csrf = v;
            }
          }
        }
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try { json = JSON.parse(text); } catch {}
          if (json && json.csrf) csrf = json.csrf;
          resolve({ status: res.statusCode, headers: res.headers, text, json });
        });
      });
      r.on('error', reject);
      if (payload) r.write(payload);
      r.end();
    });
  }

  return {
    get: (p, h) => req('GET', p, null, h),
    post: (p, b, h) => req('POST', p, b, h),
    getCsrf: () => csrf
  };
}

async function runUnitTests() {
  console.log('\n=== PART 1: UNIT TESTS (lib/bxh-engine.js, lib/rpg.js, lib/arena.js) ===');

  await test('R1: 24 Badges (21 R1 + 3 R4), 5 Grades, 6 Divisions, 4 Chests, 4 Sub-Boards', () => {
    assert.strictEqual(bxh.GRADES_5.length, 5);
    assert.strictEqual(bxh.DIVISION_TIERS.length, 6);
    assert.strictEqual(bxh.WEEKLY_MILESTONE_CHESTS.length, 4);
    assert.strictEqual(bxh.SUB_LEADERBOARDS_DEF.length, 4);
    assert.strictEqual(bxh.BADGES_24.length, 24);
    const totalChestsGold = bxh.WEEKLY_MILESTONE_CHESTS.reduce((s, c) => s + c.gold, 0);
    const totalChestsDiamonds = bxh.WEEKLY_MILESTONE_CHESTS.reduce((s, c) => s + c.diamonds, 0);
    const totalChestsTickets = bxh.WEEKLY_MILESTONE_CHESTS.reduce((s, c) => s + c.iupac_tickets, 0);
    assert.strictEqual(totalChestsGold, 480);
    assert.strictEqual(totalChestsDiamonds, 7);
    assert.strictEqual(totalChestsTickets, 3);
  });

  await test('R1/R5 Proof 2: Anti-Smurfing Lookup Table matches Doc 01 & Top 4-5 Diamond > Top 1 Bronze/Silver/Gold', () => {
    const top1Bronze = bxh.computeDivisionReward('bronze', 1, 400);
    assert.strictEqual(top1Bronze.gold, 100);
    assert.strictEqual(top1Bronze.diamonds, 2);
    assert.strictEqual(top1Bronze.iupac_tickets, 1);
    assert.strictEqual(top1Bronze.gold_charm, 0);
    assert.strictEqual(top1Bronze.xp_boost, 0);

    const top1Silver = bxh.computeDivisionReward('silver', 1, 400);
    assert.strictEqual(top1Silver.gold, 150);
    assert.strictEqual(top1Silver.diamonds, 2);
    assert.strictEqual(top1Silver.iupac_tickets, 2);
    assert.strictEqual(top1Silver.gold_charm, 1);
    assert.strictEqual(top1Silver.xp_boost, 0);

    const top1Gold = bxh.computeDivisionReward('gold', 1, 400);
    assert.strictEqual(top1Gold.gold, 250);
    assert.strictEqual(top1Gold.diamonds, 4);
    assert.strictEqual(top1Gold.iupac_tickets, 2);

    const top4Diamond = bxh.computeDivisionReward('diamond', 4, 400);
    assert.strictEqual(top4Diamond.gold, 288);
    assert.strictEqual(top4Diamond.diamonds, 5);
    assert.strictEqual(top4Diamond.iupac_tickets, 3);
    assert.strictEqual(top4Diamond.shop_shards, 2);
    assert.strictEqual(top4Diamond.gold_charm, 1);
    assert.strictEqual(top4Diamond.xp_boost, 1);

    // Strictly richer than Top 1 Bronze, Silver, and Gold
    for (const lower of [top1Bronze, top1Silver, top1Gold]) {
      assert(top4Diamond.gold > lower.gold, 'Diamond Top 4 gold > lower Top 1');
      assert(top4Diamond.diamonds > lower.diamonds, 'Diamond Top 4 diamonds > lower Top 1');
      assert(top4Diamond.iupac_tickets > lower.iupac_tickets, 'Diamond Top 4 tickets > lower Top 1');
    }

    const top1Legend = bxh.computeDivisionReward('legend', 1, 500);
    assert.strictEqual(top1Legend.gold, 800);
    assert.strictEqual(top1Legend.diamonds, 13);
    assert.strictEqual(top1Legend.iupac_tickets, 7);
    assert.strictEqual(top1Legend.promoted, false);
  });

  await test('R1 Edge Case 6: Small division boards (N < 6 and 6 <= N <= 14) align reward & standing', () => {
    // N = 5 (<6): no auto promotion/demotion, Top 1 (>=300) still gets podium reward
    const stSmall = bxh.evaluateDivisionStanding(1, 5, 'gold', 350, false);
    const rwSmall = bxh.computeDivisionReward('gold', 1, 350, 5);
    assert.strictEqual(stSmall.promoted, false);
    assert.strictEqual(rwSmall.promoted, false);
    assert.strictEqual(rwSmall.gold, 250);

    // N = 10 (6..14): demoteCount = floor(10*0.20) = 2 -> ranks 9,10 demoted and get NO reward
    const stDem = bxh.evaluateDivisionStanding(9, 10, 'gold', 260, false);
    const rwDem = bxh.computeDivisionReward('gold', 9, 260, 10);
    assert.strictEqual(stDem.demoted, true);
    assert.strictEqual(rwDem.demoted, true);
    assert.strictEqual(rwDem.gold, 0);
    assert.strictEqual(rwDem.bucket, 'none');

    // N = 10, rank 5: maxPromote = max(3, round(2.3)) = 3 -> NOT promoted, gets safe reward
    const stSafe = bxh.evaluateDivisionStanding(5, 10, 'gold', 300, false);
    const rwSafe = bxh.computeDivisionReward('gold', 5, 300, 10);
    assert.strictEqual(stSafe.promoted, false);
    assert.strictEqual(rwSafe.promoted, false);
    assert.strictEqual(rwSafe.bucket, 'top8_15');

    // Diamond rank 6 and 7 in 30-person table: Diamond only promotes Top 4-5, ranks 6-7 MUST receive top8_15 safe-zone reward (70 * 2.5 = 175 gold)!
    for (const r of [6, 7]) {
      const stDia = bxh.evaluateDivisionStanding(r, 30, 'diamond', 400, false);
      const rwDia = bxh.computeDivisionReward('diamond', r, 400, 30);
      assert.strictEqual(stDia.promoted, false);
      assert.strictEqual(rwDia.promoted, false);
      assert.strictEqual(rwDia.bucket, 'top8_15', `Diamond rank #${r} must receive safe-zone reward (not 'none')`);
      assert.strictEqual(rwDia.gold, 175, `Diamond rank #${r} safe-zone gold = 175`);
      assert.strictEqual(rwDia.iupac_shards, 1, `Diamond rank #${r} safe-zone iupac_shards = 1`);
      assert.strictEqual(rwDia.shop_shards, 1, `Diamond rank #${r} safe-zone shop_shards = 1`);
    }

    // Rank Shield prevents demotion in Top 25-30
    const stShield = bxh.evaluateDivisionStanding(28, 30, 'gold', 120, true);
    assert.strictEqual(stShield.zone, 'shielded');
    assert.strictEqual(stShield.demoted, false);
  });

  await test('R1 Regression: Exam elapsed_sec = 0 fails Quality Gate (no || 1500 bypass)', () => {
    const u = makeUser('zero_sec_exam');
    const res = bxh.recordExamDxhAndStats(
      u,
      { id: 'ex-zero', grade: '2K9', duration: 50 },
      { total: 22, answered: 22, elapsed_sec: 0, score: 10 }
    );
    assert.strictEqual(res.dxhGranted, 0, 'elapsed_sec: 0 must fail Quality Gate');
    assert.strictEqual(res.passedQualityGate, false);
  });

  await test('R1 Regression: Full Weekly Settlement (Tier 1 + Tier 2 Top 100 + Tier 3 4 Sub-Boards + Idempotency + Multi-Week Hibernation)', async () => {
    delete globalThis.__PK9_MEMORY_REDIS__;
    const redis = getRedis();
    const prevWeek = '2026-W10';
    const curWeek = '2026-W11';
    const prevNow = new Date('2026-03-04T03:00:00.000Z'); // Wed W10
    const curNow = new Date('2026-03-09T01:00:00+07:00');  // Mon W11

    const uTop1 = makeUser('top1_2k9', { grade: '2K9', now: prevNow });
    uTop1.rpg.bxh.week_key = prevWeek;
    uTop1.rpg.bxh.division_by_grade['2K9'] = 'gold';
    uTop1.rpg.bxh.dxh_week = 1800;
    uTop1.rpg.bxh.valid_days_week = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
    uTop1.rpg.bxh.weekly_stats = {
      ...uTop1.rpg.bxh.weekly_stats,
      std_exam_scores: [{ exam_id: 'e1', score: 9.2 }, { exam_id: 'e2', score: 9.0 }, { exam_id: 'e3', score: 8.8 }, { exam_id: 'e4', score: 9.0 }],
      contest_9plus_done: true, contest_9plus_bonus: 250,
      duel_1v1_wins: 5, duel_1v1_matches: 5, duel_1v1_elo: 1300,
      pomodoro_sessions_week: 8, pomodoro_verified_mins_week: 200, daily_4of4_days_week: 4,
      questions_week: 100, correct_week: 92
    };
    uTop1.rpg.bxh.prev_weeks_dxh = [{ week_key: '2026-W09', dxh: 500, grade: '2K9' }];

    const uTop2 = makeUser('top2_2k9', { grade: '2K9', now: prevNow });
    uTop2.rpg.bxh.week_key = prevWeek;
    uTop2.rpg.bxh.division_by_grade['2K9'] = 'gold';
    uTop2.rpg.bxh.dxh_week = 900;
    uTop2.rpg.bxh.valid_days_week = ['2026-03-02', '2026-03-03', '2026-03-04'];
    uTop2.rpg.bxh.weekly_stats = {
      ...uTop2.rpg.bxh.weekly_stats,
      std_exam_scores: [{ exam_id: 'e1', score: 8.0 }, { exam_id: 'e2', score: 8.0 }, { exam_id: 'e3', score: 8.0 }],
      contest_9plus_done: false, contest_9plus_bonus: 0,
      duel_1v1_wins: 3, duel_1v1_matches: 4, duel_1v1_elo: 1080,
      pomodoro_sessions_week: 6, pomodoro_verified_mins_week: 150, daily_4of4_days_week: 3,
      questions_week: 80, correct_week: 64
    };
    uTop2.rpg.bxh.prev_weeks_dxh = [{ week_key: '2026-W09', dxh: 300, grade: '2K9' }];

    // Absent user skipping 3 weeks (W08 -> W11) with 0 ĐXH -> MUST drop 1 tier & start Revival Mission without intermediate logins!
    const uAbsent = makeUser('absent_2k9', { grade: '2K9', now: new Date('2026-02-18T03:00:00.000Z') });
    uAbsent.rpg.bxh.week_key = '2026-W08';
    uAbsent.rpg.bxh.division_by_grade['2K9'] = 'gold';
    uAbsent.rpg.bxh.dxh_week = 0;

    await redis.set('phuc:user:top1_2k9', uTop1);
    await redis.set('phuc:user:top2_2k9', uTop2);
    await redis.set('phuc:user:absent_2k9', uAbsent);

    const r1 = await bxh.settleFinishedWeeks(redis, [uTop1, uTop2, uAbsent], curNow);
    assert(r1.settledUsers >= 2, `Expected settledUsers >= 2, got ${r1.settledUsers}`);

    const s1 = await redis.get('phuc:user:top1_2k9');
    assert.strictEqual(s1.rpg.bxh.week_key, curWeek);
    assert.strictEqual(s1.rpg.bxh.badge_counters['badge-system-valedictorian'], 1, 'Top 1 Whole-System unlocks Badge #4');
    assert.strictEqual(s1.rpg.bxh.badge_counters['badge-system-top100'], 1, 'Top 1 Whole-System unlocks Badge #5');
    assert(s1.rpg.temp_title && s1.rpg.temp_title.text.includes('Thủ Khoa Toàn Hệ'), 'Grants 7-day Thủ Khoa Toàn Hệ temp_title');
    assert.strictEqual(s1.rpg.bxh.badge_counters['badge-arena-warlord'], 1, 'Sub-Board #1 unlocks Badge #6');
    assert.strictEqual(s1.rpg.bxh.badge_counters['badge-exam2018-hunter'], 1, 'Sub-Board #2 unlocks Badge #7');
    assert.strictEqual(s1.rpg.bxh.badge_counters['badge-pomodoro-sub3'], 1, 'Sub-Board #3 increments Pomodoro sub-board counter for Badge #13');
    assert.strictEqual(s1.rpg.bxh.badge_counters['badge-weekly-surge'], 1, 'Sub-Board #4 unlocks Badge #8');
    assert(s1.rpg.bxh.last_weekly_settlement.layer2_rewards.length >= 4, 'Settlement banner records all Layer 2 prizes');

    const sAbs = await redis.get('phuc:user:absent_2k9');
    assert.strictEqual(sAbs.rpg.bxh.division_by_grade['2K9'], 'silver', 'Multi-week absence drops 1 tier');
    assert.strictEqual(sAbs.rpg.bxh.hibernation.revival_active, true, 'Multi-week absence activates 500 ĐXH Revival Mission');

    const goldAfterFirst = s1.rpg.gold;
    const r2 = await bxh.settleFinishedWeeks(redis, [s1, await redis.get('phuc:user:top2_2k9'), sAbs], curNow);
    assert.strictEqual(r2.settledUsers, 0, 'Idempotent settlement must not re-settle already settled week');
    const s1Again = await redis.get('phuc:user:top1_2k9');
    assert.strictEqual(s1Again.rpg.gold, goldAfterFirst, 'No double gold payout on repeated settlement');
  });

  await test('R1/R5 Proof 1: Steady 5-day learner (2,095 ĐXH) beats 1-day Sunday crammer (max 950 / 1,200 ĐXH)', () => {
    // Scenario A: 5 weekdays (Mon-Fri 2026-11-16..20), 395 ĐXH/day
    const steadyUser = makeUser('steady_a');
    for (let day = 16; day <= 20; day++) {
      const d = new Date(`2026-11-${day}T03:00:00.000Z`); // 10:00 VN
      bxh.grantWeeklyDxh(steadyUser, 395, { source: 'steady_study', now: d });
    }
    assert.strictEqual(steadyUser.rpg.bxh.dxh_week, 395 * 5 + 120); // 2,095 ĐXH!

    // Scenario B: 1-day Sunday cram (2026-11-22), tries to earn 1,783 raw ĐXH
    const cramUser = makeUser('cram_b');
    const sun = new Date('2026-11-22T05:00:00.000Z'); // Sun 12:00 VN
    const resCram = bxh.grantWeeklyDxh(cramUser, 1783, { source: 'sunday_cram', now: sun });
    assert.strictEqual(resCram.grantedDxh, 950);
    assert.strictEqual(resCram.capped, true);
    assert.strictEqual(cramUser.rpg.bxh.dxh_week, 950);
    // Even with max Đấu Trường 9+ percentile bonus (+250 ĐXH bypass)
    bxh.grantWeeklyDxh(cramUser, 250, { source: 'contest_9plus_percentile', bypassDailyCap: true, now: sun });
    assert.strictEqual(cramUser.rpg.bxh.dxh_week, 1200);
    assert(steadyUser.rpg.bxh.dxh_week - cramUser.rpg.bxh.dxh_week === 895);
    assert(cramUser.rpg.bxh.dxh_week < 2000, 'Single-day crammer can NEVER reach Chest 4 (2,000 ĐXH)');
  });

  await test('R1: Weekend Catch-Up Streak Bonus (+50 ĐXH when 0 weekdays & >=350 both Sat and Sun)', () => {
    const wkUser = makeUser('weekend_warrior');
    const sat = new Date('2026-11-21T04:00:00.000Z'); // Sat 11:00 VN
    const sun = new Date('2026-11-22T04:00:00.000Z'); // Sun 11:00 VN
    bxh.grantWeeklyDxh(wkUser, 360, { now: sat });
    bxh.grantWeeklyDxh(wkUser, 360, { now: sun });
    assert.strictEqual(wkUser.rpg.bxh.weekly_stats.weekend_catchup_granted, true);
    assert.strictEqual(wkUser.rpg.bxh.dxh_week, 360 + 360 + 50);
  });

  await test('R1: Bùa x2 EXP & Lõi x8 Vàng do NOT boost ĐXH Tuần and obey +400🪙/day gold charm cap', () => {
    const u = makeUser('booster_u');
    u.rpg.consumables.xp_boost = 5;
    u.rpg.consumables.gold_charm = 10;

    // Gold charm cap +400/day
    let totalBonus = 0;
    for (let i = 0; i < 6; i++) {
      const g = rpg.applyRewardMultipliers(u, 400, 100, 0, false); // raw 25% = +100 gold each
      totalBonus += (g.gold - 400);
    }
    assert.strictEqual(totalBonus, 400, 'Gold charm bonus capped at +400 gold/day');

    // Wrong bank & daily mission ignore gold charm
    u.rpg.bxh.daily_caps.omega_gold_bonus_today = 0;
    u.rpg.consumables.gold_charm = 5;
    const noCharm = rpg.applyRewardMultipliers(u, 100, 10, 0, false, { allowGoldCharm: false });
    assert.strictEqual(noCharm.gold, 100);
    assert.strictEqual(u.rpg.consumables.gold_charm, 5);
  });

  await test('R1: Exam Quality Gate, Score Multiplier, Repeat Limit, Cross-Grade Lock & Daily Caps', () => {
    const mon = new Date('2026-11-16T03:00:00.000Z');
    const u = makeUser('exam_student', { grade: '2K9', now: mon });

    // Too fast (< 30s) -> fails Quality Gate
    const fast = bxh.recordExamDxhAndStats(u, { id: 'e1', title: 'Đề Sở Toán', grade: '2K9', duration: 50 }, { score: 9.5, correct: 20, total: 22, answered: 22, elapsed_sec: 20 }, mon);
    assert.strictEqual(fast.dxhGranted, 0);
    assert.strictEqual(fast.reason, 'quality_gate_failed');

    // Too few answered (< 70%) -> fails Quality Gate
    const half = bxh.recordExamDxhAndStats(u, { id: 'e1', title: 'Đề Sở Toán', grade: '2K9', duration: 50 }, { score: 6.0, correct: 10, total: 20, answered: 10, elapsed_sec: 500 }, mon);
    assert.strictEqual(half.dxhGranted, 0);
    assert.strictEqual(half.reason, 'quality_gate_failed');

    // Valid standard exam 9.2đ -> 100 * 1.6 = 160 ĐXH + locks primary_grade to 2K9 + counts Sở/Bộ & GDPT2018 9+
    const ok1 = bxh.recordExamDxhAndStats(u, { id: 'e1', title: 'Đề Sở Hà Nội Toán', grade: '2K9', duration: 50 }, { score: 9.2, correct: 20, total: 22, answered: 22, elapsed_sec: 900 }, mon);
    assert.strictEqual(ok1.dxhGranted, 160);
    assert.strictEqual(u.rpg.bxh.primary_grade_locked, true);
    assert.strictEqual(u.rpg.social.gdpt2018_9plus_count, 1);
    assert.strictEqual(u.rpg.social.sobo_8plus_count, 1);

    // Cross-grade exam (2K12) after lock -> 0 ĐXH + outside_primary_grade
    const cross = bxh.recordExamDxhAndStats(u, { id: 'e_2k12', title: 'Đề Vào 10', grade: '2K12', duration: 60 }, { score: 9.0, correct: 18, total: 20, answered: 20, elapsed_sec: 900 }, mon);
    assert.strictEqual(cross.dxhGranted, 0);
    assert.strictEqual(cross.reason, 'outside_primary_grade');

    // Repeat attempt #2 with higher score -> 0.4x = 64 ĐXH
    const rep2 = bxh.recordExamDxhAndStats(u, { id: 'e1', title: 'Đề Sở Hà Nội Toán', grade: '2K9', duration: 50 }, { score: 9.8, correct: 21, total: 22, answered: 22, elapsed_sec: 900 }, mon);
    assert.strictEqual(rep2.dxhGranted, 64);

    // Repeat attempt #3 -> 0 ĐXH
    const rep3 = bxh.recordExamDxhAndStats(u, { id: 'e1', title: 'Đề Sở Hà Nội Toán', grade: '2K9', duration: 50 }, { score: 10, correct: 22, total: 22, answered: 22, elapsed_sec: 900 }, mon);
    assert.strictEqual(rep3.dxhGranted, 0);
    assert.strictEqual(rep3.reason, 'repeat_limit');
  });

  await test('R1: Tie-Breaker 5 Levels orders tied ĐXH accurately', () => {
    const a = { dxh_week: 800, std_exams_week_count: 2, std_exams_week_avg: 8.5, valid_days_count: 3, weekly_accuracy: 80, dxh_reached_at: '2026-11-18T10:00:00Z', first_valid_day_at: '2026-11-16T01:00:00Z', sbd: 'K9-2' };
    const b = { dxh_week: 800, std_exams_week_count: 1, std_exams_week_avg: 9.8, valid_days_count: 5, weekly_accuracy: 95, dxh_reached_at: '2026-11-17T10:00:00Z', first_valid_day_at: '2026-11-16T01:00:00Z', sbd: 'K9-1' };
    // a has >= 2 std exams so a beats b even though b has higher avg on 1 exam
    assert(bxh.compareWeeklyTieBreaker(a, b) < 0);

    const c = { ...a, std_exams_week_avg: 8.5, valid_days_count: 4 };
    assert(bxh.compareWeeklyTieBreaker(c, a) < 0); // Level 2: more valid days
  });

  await test('R1: Hibernation (0 ĐXH) -> 2 zero weeks drops 1 tier & starts 500 ĐXH Revival Mission -> restores next Monday', () => {
    const wk1 = new Date('2026-11-02T03:00:00.000Z'); // W45
    const wk2 = new Date('2026-11-09T03:00:00.000Z'); // W46
    const wk3 = new Date('2026-11-16T03:00:00.000Z'); // W47
    const wk4 = new Date('2026-11-23T03:00:00.000Z'); // W48

    const u = makeUser('hiber_u', { xp: 4000, now: wk1 }); // Starts Platinum
    assert.strictEqual(u.rpg.bxh.division_by_grade['2K9'], 'platinum');

    // Week 2 rollover after 0 ĐXH in Week 1 -> stays Platinum (1 zero week)
    bxh.ensureBxhUserState(u, wk2);
    assert.strictEqual(u.rpg.bxh.division_by_grade['2K9'], 'platinum');
    assert.strictEqual(u.rpg.bxh.hibernation.zero_weeks, 1);

    // Week 3 rollover after 0 ĐXH in Week 2 -> drops 1 tier to Gold & activates Revival Mission
    bxh.ensureBxhUserState(u, wk3);
    assert.strictEqual(u.rpg.bxh.division_by_grade['2K9'], 'gold');
    assert.strictEqual(u.rpg.bxh.hibernation.revival_active, true);
    assert.strictEqual(u.rpg.bxh.hibernation.restore_tier, 'platinum');

    // Earn 520 ĐXH during Week 3 -> Revival completes, pending restore next Monday + Phoenix badge
    bxh.grantWeeklyDxh(u, 520, { now: wk3 });
    assert.strictEqual(u.rpg.bxh.hibernation.pending_restore_next_monday, true);
    assert.strictEqual(u.rpg.bxh.badge_counters['badge-phoenix-return'], 1);

    // Week 4 rollover -> Platinum restored!
    bxh.ensureBxhUserState(u, wk4);
    assert.strictEqual(u.rpg.bxh.division_by_grade['2K9'], 'platinum');
    assert.strictEqual(u.rpg.bxh.hibernation.revival_active, false);
  });

  await test('R3: Showcase Slot Progression (2..6 + Bronze Borrowed Slot 3 & Shrink Fallback) + Temp Cosmetic Fallback', () => {
    const now = new Date('2026-11-16T03:00:00.000Z');
    const u = makeUser('r3_user', { xp: 120, now }); // Bronze -> 2 slots
    assert.strictEqual(u.rpg.showcase.unlocked_slots, 2);
    assert.strictEqual(u.rpg.showcase.borrowed_slot_3, false);
    assert.strictEqual(bxh.buildAvailableMilestones(u, now)[0].valueText, 'Chưa có đề'); // No fake 9.00đ!

    // Streak 7 days grants temporary Slot 3 for Bronze
    u.rpg.bxh.streak_real = 7;
    u.rpg.bxh.badge_counters['badge-division-crown'] = 1;
    u.rpg.bxh.badge_counters['badge-division-podium'] = 1;
    u.rpg.bxh.badge_counters['badge-weekly-2k'] = 1;
    bxh.syncUserBadgesAndShowcase(u, now);
    assert.strictEqual(u.rpg.showcase.unlocked_slots, 3);
    assert.strictEqual(u.rpg.showcase.borrowed_slot_3, true);
    u.rpg.showcase.showcase_badges = ['badge-division-crown', 'badge-division-podium', 'badge-weekly-2k'];

    // Lose streak -> shrinks cleanly back to 2 slots without losing badges
    u.rpg.bxh.streak_real = 1;
    u.rpg.bxh.last_week_top10 = false;
    bxh.syncUserBadgesAndShowcase(u, now);
    assert.strictEqual(u.rpg.showcase.unlocked_slots, 2);
    assert.strictEqual(u.rpg.showcase.showcase_badges.length, 2);
    assert(u.rpg.badges_24.find(x => x.id === 'badge-weekly-2k').unlocked, 'Badge remains permanently unlocked in vault');

    // Temp 7-day cosmetic expires -> reverts to previous_permanent_id
    u.rpg.equipped.frame = 'frame-bronze';
    bxh.grantTempOrPermCosmetic(u, { id: 'frame-nitro-sakura', name: 'Nitro Sakura', category: 'frame', duration_days: 7, perm_after: 3 }, 1, now);
    assert.strictEqual(u.rpg.equipped.frame, 'frame-nitro-sakura');
    const after8Days = new Date(now.getTime() + 8 * 86400000);
    bxh.ensureBxhUserState(u, after8Days);
    assert.strictEqual(u.rpg.equipped.frame, 'frame-bronze', 'Reverted cleanly to previous_permanent_id');
    assert(!u.rpg.inventory.includes('frame-nitro-sakura'));

    // Legend tier (13,000+ XP) unlocks 6 slots + legend_gold frame
    u.xp = 13500;
    bxh.syncUserBadgesAndShowcase(u, after8Days);
    assert.strictEqual(u.rpg.showcase.unlocked_slots, 6);
    assert.strictEqual(u.rpg.showcase.showcase_frame, 'legend_gold');
  });

  await test('R1: Shop Shard Redemption (6 for gold, 12 for 4-8💎, 20 for 9-14💎)', () => {
    const u = makeUser('shard_u');
    u.rpg.shop_shards = 40;
    const goldItem = rpg.CATALOG.find(i => !i.consumable && i.currency === 'gold' && i.price > 0);
    const midDiaItem = rpg.CATALOG.find(i => !i.consumable && i.currency === 'diamonds' && i.price <= 8);
    const highDiaItem = rpg.CATALOG.find(i => !i.consumable && i.currency === 'diamonds' && i.price >= 9);

    const r1 = rpg.redeemShopShards(u, goldItem.id);
    assert.strictEqual(r1.ok, true);
    assert.strictEqual(r1.shards_spent, 6);

    const r2 = rpg.redeemShopShards(u, midDiaItem.id);
    assert.strictEqual(r2.ok, true);
    assert.strictEqual(r2.shards_spent, 12);

    const r3 = rpg.redeemShopShards(u, highDiaItem.id);
    assert.strictEqual(r3.ok, true);
    assert.strictEqual(r3.shards_spent, 20);
    assert.strictEqual(u.rpg.shop_shards, 2);
  });

  await test('R2: Proactive Content Filter & Safe-by-Default 2K12 vs 2K9', () => {
    assert.strictEqual(bxh.validateProactiveContent('https://spam.com', 'Khẩu hiệu').ok, false);
    assert.strictEqual(bxh.validateProactiveContent('Liên hệ 0987654321', 'Khẩu hiệu').ok, false);
    assert.strictEqual(bxh.validateProactiveContent('Đỗ Bách Khoa 28.5+ điểm!', 'Khẩu hiệu').ok, true);

    const u12 = makeUser('kid_2k12', { grade: '2K12', school: 'THCS Nguyễn Trường Tộ Hà Nội' });
    assert.strictEqual(u12.rpg.privacy.school_visibility, 'hide_all');
    assert.strictEqual(u12.rpg.privacy.show_island_flag_pin, false);
    assert.strictEqual(u12.rpg.privacy.allow_1v1_invites, 'friends_only');
    assert.strictEqual(u12.rpg.privacy.allow_pomodoro_costudy, 'friends_only');

    const u9 = makeUser('hs_2k9', { grade: '2K9', school: 'THPT Chu Văn An Hà Nội' });
    assert.strictEqual(u9.rpg.privacy.school_visibility, 'province_grade');
    assert.strictEqual(bxh.formatVisibleSchool(u9.settings.school, '2K9', 'province_grade', false), 'Khu vực Hà Nội • Hệ 2K9');
    assert.strictEqual(bxh.formatVisibleSchool(u12.settings.school, '2K12', 'hide_all', false), 'Đã ẩn Trường & Địa phương (Safe-by-Default)');
  });
}

async function runIntegrationTests() {
  console.log('\n=== PART 2: LIVE HTTP INTEGRATION TESTS (server.js + Memory Redis) ===');
  // Ensure clean in-memory Redis before starting server
  delete globalThis.__PK9_MEMORY_REDIS__;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;

  const server = require('../server');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`  🌐 Ephemeral test server running at ${baseUrl}`);

  const guest = createHttpClient(baseUrl);
  const stuA = createHttpClient(baseUrl);
  const stuB = createHttpClient(baseUrl);
  const stu2k12 = createHttpClient(baseUrl);

  try {
    await test('Server serves index.html on /, /u/K9-12345, and static assets pk9-bxh-ecosystem.js', async () => {
      const rHome = await guest.get('/');
      assert.strictEqual(rHome.status, 200);
      assert(rHome.text.includes('pk9-bxh-ecosystem.js'));

      const rAlias = await guest.get('/u/K9-DEMO-999');
      assert.strictEqual(rAlias.status, 200);
      assert(rAlias.text.includes('<!DOCTYPE html>'));

      const rScript = await guest.get('/assets/pk9-bxh-ecosystem.js');
      assert.strictEqual(rScript.status, 200);
      assert(rScript.text.includes('PK9_BXH_ECOSYSTEM'));
    });

    await test('Guest (K9-GUEST): Leaderboard API returns 401 locked', async () => {
      const rLb = await guest.get('/api/dashboard?action=leaderboard');
      assert.strictEqual(rLb.status, 401);
      assert.strictEqual(rLb.json.locked, true);
    });

    await test('Auth Proactive Auto-Filter blocks phone/URL on register, registers Student A (2K9), Student B (2K9 w/ referral), Student C (2K12)', async () => {
      await stuA.get('/api/auth?action=me');
      const badReg = await stuA.post('/api/auth?action=register', {
        username: 'badname1',
        display_name: 'Liên hệ zalo 0912345678',
        password: 'Password123',
        preferred_grade: '2K9'
      });
      assert.strictEqual(badReg.status, 422);

      const regA = await stuA.post('/api/auth?action=register', {
        username: 'minhanh_2k9',
        display_name: 'Nguyễn Minh Anh',
        password: 'Password123',
        preferred_grade: '2K9',
        school: 'THPT Chu Văn An Hà Nội'
      }, { 'x-forwarded-for': '10.0.0.1' });
      assert.strictEqual(regA.status, 200, regA.text);
      assert.strictEqual(regA.json.ok, true);

      const stateA = await stuA.get('/api/dashboard?action=rpg-state');
      assert.strictEqual(stateA.status, 200);
      assert(stateA.json.user_rpg.sbd);
      const sbdA = stateA.json.user_rpg.sbd;

      // Register B with Referral SBD of A from a different IP
      await stuB.get('/api/auth?action=me');
      const regB = await stuB.post('/api/auth?action=register', {
        username: 'hoangnam_2k9',
        display_name: 'Trần Hoàng Nam',
        password: 'Password123',
        preferred_grade: '2K9',
        school: 'THPT Lê Hồng Phong TP.HCM',
        referred_by: sbdA
      }, { 'x-forwarded-for': '10.0.0.2' });
      assert.strictEqual(regB.status, 200, regB.text);
      assert.strictEqual(regB.json.ok, true);

      // Register C (2K12 THCS Safe-by-Default)
      await stu2k12.get('/api/auth?action=me');
      const regC = await stu2k12.post('/api/auth?action=register', {
        username: 'be_na_2k12',
        display_name: 'Lê Bảo Ngọc',
        password: 'Password123',
        preferred_grade: '2K12',
        school: 'THCS Đoàn Thị Điểm Hà Nội'
      }, { 'x-forwarded-for': '10.0.0.3' });
      assert.strictEqual(regC.status, 200, regC.text);
      assert.strictEqual(regC.json.ok, true);
      const stateC = await stu2k12.get('/api/dashboard?action=rpg-state');
      assert.strictEqual(stateC.json.user_rpg.privacy.school_visibility, 'hide_all');
      assert.strictEqual(stateC.json.user_rpg.privacy.show_island_flag_pin, false);
      assert.strictEqual(stateC.json.user_rpg.privacy.allow_1v1_invites, 'friends_only');
      assert.strictEqual(stateC.json.user_rpg.privacy.allow_pomodoro_costudy, 'friends_only');
    });

    await test('R4 Pomodoro Quality Gate + Co-Study + AI Vision + Rookie Chest Referral Activation', async () => {
      // B cannot claim Rookie Chest yet (no valid day / no qualifying exam or pomodoro)
      const earlyChest = await stuB.post('/api/dashboard?action=rpg-claim-rookie-chest', {});
      assert.strictEqual(earlyChest.status, 400);

      // Pomodoro fails if exam_active or idle > 180 or note < 15 chars
      const pExam = await stuB.post('/api/dashboard?action=rpg-pomodoro-complete', { duration_min: 25, exam_active: true, checkin_note: 'Đã ôn xong 20 câu tích phân siêu kỹ' });
      assert.strictEqual(pExam.status, 400);
      const pIdle = await stuB.post('/api/dashboard?action=rpg-pomodoro-complete', { duration_min: 25, idle_sec: 200, checkin_note: 'Đã ôn xong 20 câu tích phân siêu kỹ' });
      assert.strictEqual(pIdle.status, 400);
      const pShort = await stuB.post('/api/dashboard?action=rpg-pomodoro-complete', { duration_min: 25, checkin_note: 'Ngắn quá' });
      assert.strictEqual(pShort.status, 422);

      // Valid Pomodoro 50p Co-Study -> +42 ĐXH (> 40 valid day!) & unlocks Rookie Chest!
      const pOk = await stuB.post('/api/dashboard?action=rpg-pomodoro-complete', {
        duration_min: 50,
        co_study: true,
        status_tag: '📝 Đang giải đề 2018',
        checkin_note: 'Đã hoàn thành trọn vẹn 50 phút giải đề chuẩn GDPT 2018 môn Toán!'
      });
      assert.strictEqual(pOk.status, 200, pOk.text);
      assert.strictEqual(pOk.json.dxh_earned, 42);
      assert.strictEqual(pOk.json.rpg.social.costudy_sessions, 1);

      // Now B claims Rookie Chest -> gets +100 gold, +3 x2 EXP, +1 IUPAC ticket; Referrer A gets +50 gold & Badge #22!
      const goldABefore = (await stuA.get('/api/dashboard?action=rpg-state')).json.user_rpg.gold;
      const claimRookie = await stuB.post('/api/dashboard?action=rpg-claim-rookie-chest', {});
      assert.strictEqual(claimRookie.status, 200, claimRookie.text);
      const stateAAfter = (await stuA.get('/api/dashboard?action=rpg-state')).json.user_rpg;
      assert.strictEqual(stateAAfter.gold, goldABefore + 50);
      assert.strictEqual(stateAAfter.bxh.badge_counters['badge-ambassador-k9'], 1);

      // AI Vision 2 variants: fail returns 400, pass returns +15 ĐXH
      const aiFail = await stuB.post('/api/dashboard?action=rpg-ai-vision-verify', { passed_variants: false });
      assert.strictEqual(aiFail.status, 400);
      const aiOk = await stuB.post('/api/dashboard?action=rpg-ai-vision-verify', { passed_variants: true });
      assert.strictEqual(aiOk.status, 200);
      assert.strictEqual(aiOk.json.dxh_earned, 15);
    });

    await test('R1: Exam Start/Submit + Cross-Grade Warning + Record-Study Video/Flashcard Caps + Chest 1 Claim', async () => {
      // Student A earns ĐXH on a 2K9 exam via /api/exams?action=start & submit
      const listRes = await stuA.get('/api/exams?action=list');
      assert.strictEqual(listRes.status, 200);
      const exam2k9 = listRes.json.exams.find(e => bxh.normalizeGrade(e.grade || e.program) === '2K9');
      assert(exam2k9, 'Found a 2K9 exam');

      const st = await stuA.post('/api/exams?action=start', { id: exam2k9.id });
      assert.strictEqual(st.status, 200);
      assert.strictEqual(st.json.outside_primary_grade, false);

      // Backdate startedAt in Redis so elapsed_sec passes Quality Gate realistically
      const redis = getRedis();
      const attKey = `phuc:exam:attempt:${st.json.attemptId}`;
      const rawAtt = await redis.get(attKey);
      const attObj = typeof rawAtt === 'string' ? JSON.parse(rawAtt) : rawAtt;
      attObj.startedAt = Date.now() - 1200 * 1000; // 20 mins ago
      await redis.set(attKey, JSON.stringify(attObj));

      // Answer all questions
      const ans = {};
      for (const q of st.json.exam.questions || []) {
        if (q.type === 'tf') ans[q.id] = { a: true, b: false, c: true, d: false };
        else if (q.type === 'short') ans[q.id] = '1';
        else ans[q.id] = 'A';
      }
      const sub = await stuA.post('/api/exams?action=submit', {
        attemptId: st.json.attemptId,
        examId: exam2k9.id,
        answers: ans
      });
      assert.strictEqual(sub.status, 200, sub.text);
      assert(sub.json.dxh_earned > 0, `Expected dxh_earned > 0, got ${sub.json.dxh_earned}`);

      // Secondary record-exam call for same attemptId does NOT double-award ĐXH!
      const dxhBeforeRec = sub.json.rpg.bxh.dxh_week;
      const rec2 = await stuA.post('/api/dashboard?action=record-exam', {
        attempt_id: st.json.attemptId,
        exam_id: exam2k9.id,
        score: sub.json.result.score,
        correct: sub.json.result.correct,
        total_questions: sub.json.result.total
      });
      assert.strictEqual(rec2.status, 200);
      assert.strictEqual(rec2.json.rpg.bxh.dxh_week, dxhBeforeRec, 'No double ĐXH on record-exam');
      assert.strictEqual(rec2.json.dxh_earned, sub.json.dxh_earned, 'Preserves original dxh_earned for UI');

      // Record 6 videos (+150 ĐXH) + 10 flashcards (+80 ĐXH) to exceed Chest 1 (250 ĐXH)
      for (let i = 1; i <= 7; i++) {
        const vRes = await stuA.post('/api/dashboard?action=record-study', {
          type: 'lesson',
          item_id: `vid_${i}`,
          duration_min: 15,
          watch_ratio: 0.9,
          playback_rate: 1.25
        });
        if (i <= 6) assert.strictEqual(vRes.json.dxh_earned, 25);
        else assert.strictEqual(vRes.json.dxh_earned, 0, '7th video capped at 0 ĐXH');
      }
      for (let i = 1; i <= 10; i++) {
        const fcRes = await stuA.post('/api/dashboard?action=record-study', {
          type: 'flashcard',
          item_id: `fc_${i}`,
          view_sec: 8
        });
        assert.strictEqual(fcRes.json.dxh_earned, 8);
      }

      // Claim Weekly Milestone Chest 1 (250 ĐXH)
      const ch1 = await stuA.post('/api/dashboard?action=rpg-claim-weekly-chest', { chest_id: 'chest_1' });
      assert.strictEqual(ch1.status, 200, ch1.text);
      // Duplicate claim rejected
      const ch1Dup = await stuA.post('/api/dashboard?action=rpg-claim-weekly-chest', { chest_id: 'chest_1' });
      assert.strictEqual(ch1Dup.status, 409);
    });

    await test('R1/R2: 3-Tier Leaderboard API + Public Profile 4-Tier + Anonymous BXH Locks ?card=<username>', async () => {
      const lbA = await stuA.get('/api/dashboard?action=leaderboard&grade=2K9');
      assert.strictEqual(lbA.status, 200);
      assert.strictEqual(lbA.json.locked, false);
      assert(lbA.json.tier1_division.rows.length >= 2, 'Both A and B in 2K9 Tier 1');
      assert(lbA.json.tier2_system_top100.weekly_top100.length >= 2);
      assert(lbA.json.my_bxh_status.chests.length === 4);

      const rowA = lbA.json.tier1_division.rows.find(r => r.username === 'minhanh_2k9');
      assert(rowA);
      assert.strictEqual(rowA.school, 'Khu vực Hà Nội • Hệ 2K9'); // Default province_grade!

      // Guest can inspect Student A public card by SBD
      const cardGuest = await guest.get(`/api/dashboard?action=student-card&sbd=${encodeURIComponent(rowA.sbd)}`);
      assert.strictEqual(cardGuest.status, 200);
      assert.strictEqual(cardGuest.json.verified, true);
      assert.strictEqual(cardGuest.json.card.sbd, rowA.sbd);
      assert(cardGuest.json.card.verified_metrics_8);

      // Student B inspects Student A -> gets comparison & actionable_nudge!
      const cardFromB = await stuB.get(`/api/dashboard?action=student-card&sbd=${encodeURIComponent(rowA.sbd)}`);
      assert.strictEqual(cardFromB.status, 200);
      assert(cardFromB.json.comparison);
      assert(cardFromB.json.comparison.actionable_nudge.includes('ĐXH'));

      // Student A turns on Anonymous BXH -> ?card=minhanh_2k9 MUST be locked, ?card=<anon_sbd> MUST work!
      const privRes = await stuA.post('/api/dashboard?action=rpg-privacy-save', {
        anonymous_bxh: true,
        school_visibility: 'hide_all',
        allow_pomodoro_costudy: 'friends_only'
      });
      assert.strictEqual(privRes.status, 200);
      const anonSbdA = privRes.json.rpg.anon_sbd;

      const byUsername = await stuB.get('/api/dashboard?action=student-card&u=minhanh_2k9');
      assert.strictEqual(byUsername.status, 200);
      assert.strictEqual(byUsername.json.anonymous_locked, true);

      // Regression: Accessing by OLD real SBD while anonymous_bxh is ON must ALSO return anonymous_locked: true (not fake guest card!)
      const byOldSbd = await stuB.get(`/api/dashboard?action=student-card&sbd=${encodeURIComponent(rowA.sbd)}`);
      assert.strictEqual(byOldSbd.status, 200);
      assert.strictEqual(byOldSbd.json.anonymous_locked, true, 'Old real SBD must return anonymous_locked: true');

      // Regression: Leaderboard JSON sent to another user MUST NOT leak real username or real_sbd of anonymous user!
      const lbFromB = await stuB.get('/api/dashboard?action=leaderboard&grade=2K9');
      const lbJsonStr = JSON.stringify(lbFromB.json);
      assert(!lbJsonStr.includes('"minhanh_2k9"'), 'Leaderboard JSON must NEVER leak real username of anonymous user');
      assert(!lbJsonStr.includes(rowA.sbd), 'Leaderboard JSON must NEVER leak real SBD of anonymous user');
      const anonRowInLb = lbFromB.json.tier1_division.rows.find(r => r.sbd === anonSbdA);
      assert(anonRowInLb && anonRowInLb.is_anonymous === true && !anonRowInLb.real_sbd, 'Anonymous row masked cleanly');

      const byAnonSbd = await stuB.get(`/api/dashboard?action=student-card&sbd=${encodeURIComponent(anonSbdA)}`);
      assert.strictEqual(byAnonSbd.status, 200);
      assert.strictEqual(byAnonSbd.json.verified, true);
      assert.strictEqual(byAnonSbd.json.card.motto, ''); // Motto hidden in anonymous mode!
      assert(byAnonSbd.json.card.display_name.includes(anonSbdA));

      // Turn anonymous back off for micro-action tests
      await stuA.post('/api/dashboard?action=rpg-privacy-save', { anonymous_bxh: false });
    });

    await test('R2: 4 Micro-Actions (Cheer, Rival Pin, 1v1 Challenge + 2K12 Protection, Block 5 Channels)', async () => {
      // B cheers A (B already has >= 40 ĐXH today from Pomodoro 50p)
      const chOk = await stuB.post('/api/dashboard?action=rpg-micro-cheer', { target_username: 'minhanh_2k9', preset_index: 0 });
      assert.strictEqual(chOk.status, 200, chOk.text);
      assert.strictEqual(chOk.json.target_cheer_score, 1);

      // B cannot cheer A twice on same day
      const chDup = await stuB.post('/api/dashboard?action=rpg-micro-cheer', { target_username: 'minhanh_2k9', preset_index: 1 });
      assert.strictEqual(chDup.status, 409);

      // B pins A as Rival
      const rivOn = await stuB.post('/api/dashboard?action=rpg-micro-rival', { target_username: 'minhanh_2k9' });
      assert.strictEqual(rivOn.status, 200);
      assert.strictEqual(rivOn.json.pinned, true);

      // B challenges 2K12 student C -> BLOCKED by Safe-by-Default (friends_only)!
      const chal2k12 = await stuB.post('/api/dashboard?action=rpg-micro-challenge-1v1', { target_username: 'be_na_2k12', subject: 'Toán' });
      assert.strictEqual(chal2k12.status, 403);

      // B challenges A (2K9 everyone) -> creates real duel room & sends to A's duel_inbox!
      const chalA = await stuB.post('/api/dashboard?action=rpg-micro-challenge-1v1', { target_username: 'minhanh_2k9', subject: 'Toán' });
      assert.strictEqual(chalA.status, 200, chalA.text);
      assert(chalA.json.room_code);

      // 10-min cooldown blocks immediate second challenge
      const chalACd = await stuB.post('/api/dashboard?action=rpg-micro-challenge-1v1', { target_username: 'minhanh_2k9', subject: 'Toán' });
      assert.strictEqual(chalACd.status, 429);

      // A blocks B -> removes rival/blocks cheer, rival pin, rivals_hud & 1v1 (2-way blocking!)
      const blk = await stuA.post('/api/dashboard?action=rpg-micro-block', { target_username: 'hoangnam_2k9' });
      assert.strictEqual(blk.status, 200);
      assert.strictEqual(blk.json.blocked, true);

      const chBlocked = await stuB.post('/api/dashboard?action=rpg-micro-cheer', { target_username: 'minhanh_2k9' });
      assert.strictEqual(chBlocked.status, 403);

      // Regression: 2-way block MUST block B from pinning A as Rival and hide A from B's rivals_hud & Pomodoro peers!
      const rivBlocked = await stuB.post('/api/dashboard?action=rpg-micro-rival', { target_username: 'minhanh_2k9' });
      assert.strictEqual(rivBlocked.status, 403, 'Blocked user must be rejected from pinning blocker as Rival');
      const lbBWhileBlocked = await stuB.get('/api/dashboard?action=leaderboard&grade=2K9');
      const aInBRivals = (lbBWhileBlocked.json.my_bxh_status?.rivals_hud || []).some(rv => rv.username === 'minhanh_2k9');
      assert.strictEqual(aInBRivals, false, 'Blocker A must be hidden from B rivals_hud');
      const aRowForB = lbBWhileBlocked.json.tier1_division.rows.find(r => r.username === 'minhanh_2k9');
      assert.strictEqual(aRowForB?.blocked_by_peer, true, 'Row exposes blocked_by_peer flag for Pomodoro peer filtering');

      // Unblock B
      const unblk = await stuA.post('/api/dashboard?action=rpg-micro-block', { target_username: 'hoangnam_2k9' });
      assert.strictEqual(unblk.json.blocked, false);
    });

    await test('R3: Showcase Save (5 Zones + Motto Filter) & All 4 Smart Presets', async () => {
      const badMotto = await stuA.post('/api/dashboard?action=rpg-showcase-save', { motto: 'vào https://evil.com xem nhé' });
      assert.strictEqual(badMotto.status, 422);

      const saveOk = await stuA.post('/api/dashboard?action=rpg-showcase-save', {
        motto: 'ĐH Bách Khoa Hà Nội • A00 • 28.5+',
        featured_iupac: 6,
        milestone_ids: ['weekly_dxh', 'max_streak', 'iupac_unlocked']
      });
      assert.strictEqual(saveOk.status, 200, saveOk.text);
      assert.strictEqual(saveOk.json.showcase.featured_iupac, 6);
      assert.strictEqual(saveOk.json.showcase.milestone_cards.length, 3);

      for (const presetId of ['exam_warlord', 'pomodoro_valedictorian', 'iupac_collector', 'weekly_top_glow']) {
        const pr = await stuA.post('/api/dashboard?action=rpg-showcase-preset', { preset_id: presetId });
        assert.strictEqual(pr.status, 200, pr.text);
        assert.strictEqual(pr.json.showcase.active_preset, presetId);
      }
    });

    await test('R1: Gold Sink Rank Shield monthly purchase limit (max 1/month)', async () => {
      const redis = getRedis();
      const rawA = await redis.get('phuc:user:minhanh_2k9');
      rawA.rpg.gold = 1000;
      await redis.set('phuc:user:minhanh_2k9', rawA);

      const buy1 = await stuA.post('/api/dashboard?action=rpg-buy', { item_id: 'item-rank-shield' });
      assert.strictEqual(buy1.status, 200, buy1.text);
      assert.strictEqual(buy1.json.rpg.bxh.rank_shield_count, 1);

      const buy2 = await stuA.post('/api/dashboard?action=rpg-buy', { item_id: 'item-rank-shield' });
      assert.strictEqual(buy2.status, 409, '2nd Rank Shield purchase in same month MUST be rejected');
    });

    await test('R4: Study Squad Rules (Tue Lockout / Same-Grade / >=550 Bonus + Admin Blocked)', async () => {
      const redis = getRedis();
      const wk = rpg.vnWeekKey();
      const isBeforeTue = bxh.isBeforeTuesdayEndVn();
      const sqCreate = await stuA.post('/api/dashboard?action=rpg-squad-action', { mode: 'create', name: 'Biệt Đội 2K9' });
      if (isBeforeTue) {
        assert.strictEqual(sqCreate.status, 200, sqCreate.text);
        const code = sqCreate.json.squad.code;
        // 2K12 student C cannot join 2K9 squad
        const wrongGrade = await stu2k12.post('/api/dashboard?action=rpg-squad-action', { mode: 'join', code });
        assert.strictEqual(wrongGrade.status, 400);
        // 2K9 student B joins
        const joinB = await stuB.post('/api/dashboard?action=rpg-squad-action', { mode: 'join', code });
        assert.strictEqual(joinB.status, 200, joinB.text);
      } else {
        // After Tuesday 23:59 VN -> locked hard!
        assert.strictEqual(sqCreate.status, 409);
      }

      // Verify Study Squad +15% Chests Bonus calculation (<= 72 gold max) directly via seeded squad in Redis
      const squadCode = 'SQ-2K9-TEST';
      await redis.set(`phuc:rpg:squad:${wk}:${squadCode}`, {
        code: squadCode,
        name: 'Biệt Đội Test 9+',
        week_key: wk,
        grade: '2K9',
        leader: 'minhanh_2k9',
        members: ['minhanh_2k9', 'hoangnam_2k9'],
        bonus_claimed_by: [],
        created_at: new Date().toISOString()
      });
      const uA = await redis.get('phuc:user:minhanh_2k9');
      const uB = await redis.get('phuc:user:hoangnam_2k9');
      uA.rpg.social.squad_code = squadCode;
      uB.rpg.social.squad_code = squadCode;
      // Before both hit 550 ĐXH -> claim must fail with 400
      uA.rpg.bxh.dxh_week = 2100;
      uB.rpg.bxh.dxh_week = 300;
      await redis.set('phuc:user:minhanh_2k9', uA);
      await redis.set('phuc:user:hoangnam_2k9', uB);
      const failClaim = await stuA.post('/api/dashboard?action=rpg-squad-action', { mode: 'claim-bonus' });
      assert.strictEqual(failClaim.status, 400);

      // Once 100% reach >= 550 ĐXH -> A (at 2100 ĐXH -> all 4 chests = 480 gold base) receives +72 gold (15%) & Badge #24!
      uB.rpg.bxh.dxh_week = 600;
      await redis.set('phuc:user:hoangnam_2k9', uB);
      const okClaim = await stuA.post('/api/dashboard?action=rpg-squad-action', { mode: 'claim-bonus' });
      assert.strictEqual(okClaim.status, 200, okClaim.text);
      assert.strictEqual(okClaim.json.bonus_gold, 72);
      assert.strictEqual(okClaim.json.rpg.bxh.badge_counters['badge-squad-leader'], 1);

      // Duplicate claim rejected
      const dupClaim = await stuA.post('/api/dashboard?action=rpg-squad-action', { mode: 'claim-bonus' });
      assert.strictEqual(dupClaim.status, 409);
    });

    await test('R1/R5: 1v1 Arena Anti-Win-Trading (60s Quality Gate + 7-Day Same-Opponent Elo Block + Underdog 200 Elo)', async () => {
      const redis = getRedis();
      const uA = await redis.get('phuc:user:minhanh_2k9');
      const uB = await redis.get('phuc:user:hoangnam_2k9');
      // Give A 1200 Elo and B 1000 Elo so B beating A tests exact 200-Elo Underdog snapshot fix!
      uA.rpg.bxh.weekly_stats.duel_1v1_elo = 1200;
      uB.rpg.bxh.weekly_stats.duel_1v1_elo = 1000;
      await redis.set('phuc:user:minhanh_2k9', uA);
      await redis.set('phuc:user:hoangnam_2k9', uB);

      // Match 1: valid >= 60s & 100% answered -> B upsets A (+24 Elo for B, -16 for A, B earns Underdog badge!)
      const room1 = await arena.createDuelRoom(redis, uA, { subject: 'Toán', count: 5, title: 'Match 1' });
      await arena.joinDuelRoom(redis, room1.code, uB);
      const ansAll = {};
      const ansWrong = {};
      for (const q of room1.questions) {
        ansAll[q.id] = Number(q.correct || 0);
        ansWrong[q.id] = (Number(q.correct || 0) + 1) % 4;
      }

      await arena.submitDuelRoom(redis, room1.code, uA, ansWrong, 90);
      await arena.submitDuelRoom(redis, room1.code, uB, ansAll, 85);
      const uBAfter1 = await redis.get('phuc:user:hoangnam_2k9');
      const uAAfter1 = await redis.get('phuc:user:minhanh_2k9');
      assert.strictEqual(uBAfter1.rpg.bxh.weekly_stats.duel_1v1_elo, 1024, 'First win against A adds +24 Elo');
      assert.strictEqual(uAAfter1.rpg.bxh.weekly_stats.duel_1v1_elo, 1184, 'Loss subtracts 16 Elo');
      assert.strictEqual(uBAfter1.rpg.bxh.weekly_stats.duel_1v1_wins, 1);
      assert.strictEqual(uBAfter1.rpg.bxh.badge_counters['badge-underdog'], 1, 'Upset over +200 Elo opponent awards Underdog badge');

      // Match 2 vs SAME opponent A within 7 days -> Elo & valid weekly wins MUST NOT increase!
      const room2 = await arena.createDuelRoom(redis, uAAfter1, { subject: 'Toán', count: 5, title: 'Match 2' });
      await arena.joinDuelRoom(redis, room2.code, uBAfter1);
      const ansAll2 = {};
      const ansWrong2 = {};
      for (const q of room2.questions) {
        ansAll2[q.id] = Number(q.correct || 0);
        ansWrong2[q.id] = (Number(q.correct || 0) + 1) % 4;
      }
      await arena.submitDuelRoom(redis, room2.code, uAAfter1, ansWrong2, 85);
      await arena.submitDuelRoom(redis, room2.code, uBAfter1, ansAll2, 80);
      const uBAfter2 = await redis.get('phuc:user:hoangnam_2k9');
      assert.strictEqual(uBAfter2.rpg.bxh.weekly_stats.duel_1v1_elo, 1024, 'Rematch within 7 days MUST NOT grant Elo');
      assert.strictEqual(uBAfter2.rpg.bxh.weekly_stats.duel_1v1_wins, 1, 'Rematch within 7 days MUST NOT count toward Sub-Board #1 wins');

      // Regression: listOpenDuels() MUST include host username for R2 Lobby inspect touchpoint
      const room3 = await arena.createDuelRoom(redis, uAAfter1, { subject: 'Toán', count: 5, title: 'Open Lobby Inspect' });
      const openList = await arena.listOpenDuels(redis);
      const foundOpen = openList.find(d => d.code === room3.code);
      assert(foundOpen && foundOpen.host === 'minhanh_2k9', 'listOpenDuels must include host username');

      // Regression: time_sec: 0 via HTTP duel-submit MUST NOT default to 60s -> triggers <15s early-quit strike!
      await stuB.post('/api/exams?action=duel-join', { code: room3.code });
      const earlySub = await stuB.post('/api/exams?action=duel-submit', { code: room3.code, answers: {}, time_sec: 0 });
      assert.strictEqual(earlySub.status, 200, earlySub.text);
      assert.strictEqual(earlySub.json.reward.early_quit_strike, 1, 'time_sec: 0 must trigger early-quit strike #1');
      assert.strictEqual(earlySub.json.reward.dxh, 0, 'time_sec: 0 must NOT grant ĐXH');
    });

    await test('R1/R3/R5 Regressions: Flashcard/Video Zero-Bypass, PDF Pro +10 ĐXH, Contest 9+ No Double-ĐXH, Legend 13K Frame & /u/:sbd OG Meta', async () => {
      const redis = getRedis();

      // 1. Flashcard view_sec: 0 & micro_check_failed: true MUST NOT mark mastered or burn 180-day lock!
      const fcZero = await stuB.post('/api/dashboard?action=record-study', { type: 'flashcard', item_id: 'fc_reg_1', view_sec: 0 });
      assert.strictEqual(fcZero.status, 200);
      assert.strictEqual(fcZero.json.dxh_earned, 0, 'view_sec: 0 must get 0 ĐXH');
      const uB0 = await redis.get('phuc:user:hoangnam_2k9');
      assert.notStrictEqual(uB0.rpg.flashcards_state?.fc_reg_1?.status, 'mastered', 'Failed view_sec must NOT mark mastered');

      const fcMicroFail = await stuB.post('/api/dashboard?action=record-study', { type: 'flashcard', item_id: 'fc_reg_1', view_sec: 9, micro_check_failed: true });
      assert.strictEqual(fcMicroFail.status, 200);
      assert.strictEqual(fcMicroFail.json.dxh_earned, 0, 'micro_check_failed must get 0 ĐXH');
      const uB1 = await redis.get('phuc:user:hoangnam_2k9');
      assert.notStrictEqual(uB1.rpg.flashcards_state?.fc_reg_1?.status, 'mastered', 'Failed Micro-Check must NOT mark mastered');

      // Retrying same card legitimately with view_sec: 8 MUST NOW SUCCEED (lock was not burned!)
      const fcRetryOk = await stuB.post('/api/dashboard?action=record-study', { type: 'flashcard', item_id: 'fc_reg_1', view_sec: 8, micro_check_passed: true });
      assert.strictEqual(fcRetryOk.status, 200);
      assert.strictEqual(fcRetryOk.json.dxh_earned, 8, 'Legitimate retry after failed gate must earn +8 ĐXH');

      // 2. Short video duration_min: 0 MUST NOT bypass 3-minute floor to 10m!
      const vidZero = await stuB.post('/api/dashboard?action=record-study', { type: 'lesson', item_id: 'vid_zero_1', duration_min: 0, watch_ratio: 1, playback_rate: 1 });
      assert.strictEqual(vidZero.status, 200);
      assert.strictEqual(vidZero.json.dxh_earned, 0, 'duration_min: 0 must get 0 ĐXH');

      // 3. PDF Pro read + note earns +10 ĐXH & credits Badge #17!
      const pdfOk = await stuB.post('/api/dashboard?action=record-study', { type: 'pdf', item_id: 'ref-0', read_ratio: 1, note_saved: true });
      assert.strictEqual(pdfOk.status, 200, pdfOk.text);
      assert.strictEqual(pdfOk.json.dxh_earned, 10, 'PDF Pro with note earns +10 ĐXH');
      assert((pdfOk.json.rpg.bxh.badge_counters['badge-video-pdf-scholar'] || 0) >= 1, 'PDF Pro credits Badge #17');

      // 4. Contest Đấu Trường 9+ HTTP E2E: instant blank submit gets 0 ĐXH; valid submit gets contest ĐXH without double-stacking normal exam ĐXH!
      const listRes = await stuB.get('/api/exams?action=list');
      const contestExam = listRes.json.exams.find(e => bxh.normalizeGrade(e.grade || e.program) === '2K9');
      const nowMs = Date.now();
      await arena.saveContest(redis, {
        id: 'cnt-test-live',
        title: 'Đấu Trường 9+ Test Live',
        examId: contestExam.id,
        examTitle: contestExam.title,
        startAt: new Date(nowMs - 60000).toISOString(),
        endAt: new Date(nowMs + 3600000).toISOString()
      }, 'admin');

      // Instant blank submission on live contest -> 0 ĐXH!
      const cStart1 = await stuB.post('/api/exams?action=start', { id: contestExam.id });
      const cSub1 = await stuB.post('/api/exams?action=submit', { attemptId: cStart1.json.attemptId, examId: contestExam.id, contestId: 'cnt-test-live', answers: {} });
      assert.strictEqual(cSub1.status, 200, cSub1.text);
      assert.strictEqual(cSub1.json.dxh_earned, 0, 'Blank instant contest submission must get 0 ĐXH');

      // Valid submission on live contest -> gets contest ĐXH (+120 + percentile bonus 30..250) WITHOUT double-stacking normal exam ĐXH!
      const cStart2 = await stuB.post('/api/exams?action=start', { id: contestExam.id });
      const attKey2 = `phuc:exam:attempt:${cStart2.json.attemptId}`;
      const rawAtt2 = await redis.get(attKey2);
      const attObj2 = typeof rawAtt2 === 'string' ? JSON.parse(rawAtt2) : rawAtt2;
      attObj2.startedAt = Date.now() - 1200 * 1000;
      await redis.set(attKey2, JSON.stringify(attObj2));
      const cAns = {};
      for (const q of cStart2.json.exam.questions || []) {
        if (q.type === 'truefalse') cAns[q.id] = [true, false, true, false];
        else if (q.type === 'short') cAns[q.id] = '1';
        else cAns[q.id] = 'A';
      }
      const dxhBeforeContest = (await redis.get('phuc:user:hoangnam_2k9')).rpg.bxh.dxh_week;
      const cSub2 = await stuB.post('/api/exams?action=submit', { attemptId: cStart2.json.attemptId, examId: contestExam.id, contestId: 'cnt-test-live', answers: cAns });
      assert.strictEqual(cSub2.status, 200, cSub2.text);
      assert(cSub2.json.dxh_earned >= 150 && cSub2.json.dxh_earned <= 370, `Contest valid submit must award 120 + percentile bonus (150..370) without double-stacking normal exam ĐXH, got ${cSub2.json.dxh_earned}`);
      const dxhAfterContest = (await redis.get('phuc:user:hoangnam_2k9')).rpg.bxh.dxh_week;
      assert.strictEqual(dxhAfterContest - dxhBeforeContest, cSub2.json.dxh_earned, 'Contest ĐXH exact delta matches response');

      // 5. Legend 13,000+ XP unlocks legend_gold showcase frame even without Legend division
      const uBExp = await redis.get('phuc:user:hoangnam_2k9');
      uBExp.xp = 13500;
      await redis.set('phuc:user:hoangnam_2k9', uBExp);
      const legFrameRes = await stuB.post('/api/dashboard?action=rpg-showcase-save', { showcase_frame: 'legend_gold' });
      assert.strictEqual(legFrameRes.status, 200, legFrameRes.text);
      assert.strictEqual(legFrameRes.json.showcase.showcase_frame, 'legend_gold', '13,000+ XP unlocks legend_gold showcase frame');

      // 6. OG Meta endpoint customizes title/url for /u/:sbd crawlers
      const ogRes = await guest.get('/api/og-meta?card=K9-TEST-888');
      assert.strictEqual(ogRes.status, 200);
      assert(ogRes.text.includes('Hồ Sơ Học Viên K9-TEST-888'), 'og-meta renders personalized card title');
      assert(ogRes.text.includes('/u/K9-TEST-888'), 'og-meta renders /u/:sbd og:url');
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

(async () => {
  await runUnitTests();
  await runIntegrationTests();
  console.log(`\n========================================`);
  console.log(`TOTAL: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);
  if (failed > 0) process.exit(1);
})();
