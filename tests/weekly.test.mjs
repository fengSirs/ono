import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { brasiliaWeek } from '../backend/src/domain/weekly.mjs';
import { native, flush } from './native-harness.mjs';
import { setup, request } from './harness.mjs';

test('Brasília weeks close exactly at Monday 00:00, including year boundaries', () => {
  const before = brasiliaWeek(Date.parse('2026-11-23T02:59:59.999Z'));
  assert.equal(before.key, '2026-11-16');
  assert.equal(before.end, Date.parse('2026-11-23T03:00:00Z'));
  assert.equal(brasiliaWeek(before.end).key, '2026-11-23');
  assert.equal(brasiliaWeek(Date.parse('2027-01-01T03:00:00Z')).key, '2026-12-28');
});

test('weekly slots are atomic, immutable, and checked on claims', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'ono-weekly-'));
  process.env.ONO_DB = join(dir, 'weekly.sqlite');
  const { env, closeDatabase } = await import('../backend/src/db.mjs');
  const { christmasAction, christmasSnapshot } = await import('../backend/src/domain/christmas.mjs');
  const db = env.DB;
  const now = Date.parse('2026-11-22T23:00:00Z');
  const settings = { officialStartsAt: '2026-11-01T03:00:00Z', previewStartsAt: '2026-10-01T03:00:00Z', endsAt: '2026-12-31T02:59:59.999Z', claimEndsAt: '2027-01-02T02:59:59.999Z' };
  await db.prepare("INSERT INTO christmas_settings VALUES('natal-2026',?)").bind(JSON.stringify(settings)).run();
  async function user(id, fed = 99, feed = 1, preview = false) {
    const key = 'natal-2026-' + (preview ? 'preview' : 'live') + ':' + id;
    await db.prepare('INSERT INTO sessions(id,token,name,seen) VALUES(?,?,?,?)').bind(id, id + '-token', 'Player ' + id, now).run();
    await db.prepare('INSERT INTO christmas_wallets(id,campaign,player,fed,feed) VALUES(?,?,?,?,?)').bind(key, preview ? 'natal-2026-preview' : 'natal-2026-live', id, fed, feed).run();
    await db.prepare('INSERT INTO christmas_pets VALUES(?,?,?,?)').bind(key, now - 10000, now - 5000, now - 5000).run();
    return id;
  }
  const feed = (id, at = now, requestId = randomUUID()) => christmasAction(db, id, { op: 'christmasFeed', amount: 1, requestId }, at);
  const claim = (id, at = now, overrides = {}) => christmasAction(db, id, { op: 'christmasClaim', name: 'Player ' + id, contact: '+55119' + id.replace(/\D/g, '').padStart(8, '0'), consent: true, ...overrides }, at);
  try {
    await t.test('101 simultaneous completions include exactly 100 eligible users with stable tie order', async () => {
      const ids = [];
      for (let i = 1; i <= 101; i++) ids.push(await user('p' + i));
      await Promise.all(ids.map(id => feed(id)));
      const rows = (await db.prepare('SELECT player,position FROM christmas_completions ORDER BY position').all()).results;
      assert.equal(rows.length, 101);
      assert.deepEqual(rows.map(r => r.position), Array.from({ length: 101 }, (_, i) => i + 1));
      const board = (await christmasAction(db, rows[99].player, { op: 'christmasLeaderboard' }, now)).leaderboard;
      assert.equal(board.entries.length, 100);
      assert.equal(board.completed, 101);
      assert.equal(board.remaining, 0);
      assert.equal(board.eligible, true);
      assert.equal(board.own.rank, 100);
      assert.equal(board.entries.filter(e => e.isMe).length, 1);
      assert.equal(board.entries.every(e => !('player' in e) && !('contact' in e) && !('wallet' in e)), true);
      const last = rows[100].player;
      await assert.rejects(claim(last), /weeklyNotQualified/);
      const winner = rows[99].player;
      const registered = (await claim(winner)).christmas.claim;
      assert.equal(registered.status, 'pending');
      assert.equal((await claim(winner)).christmas.claim.id, registered.id);
      const record = await db.prepare('SELECT completion_id FROM christmas_claims WHERE id=?').bind(registered.id).first();
      assert.ok(record.completion_id);
    });
    await t.test('duplicate feeds and failed feeds never reserve extra positions', async () => {
      const id = await user('p102'), requestId = randomUUID();
      await Promise.all([feed(id, now, requestId), feed(id, now, requestId)]);
      assert.equal((await db.prepare('SELECT count(*) AS n FROM christmas_completions WHERE player=?').bind(id).first()).n, 1);
      await user('p103', 99, 0);
      await assert.rejects(feed('p103'), /notEnoughFeed/);
      assert.equal((await db.prepare('SELECT count(*) AS n FROM christmas_completions WHERE player=?').bind('p103').first()).n, 0);
    });
    await t.test('a transaction failure rolls back feeding, ledger, and completion together', async () => {
      await user('p104');
      // An actual SQLite trigger failure exercises db.batch rollback rather than a mock.
      const sql = new DatabaseSync(process.env.ONO_DB);
      sql.exec("CREATE TRIGGER fail_completion BEFORE INSERT ON christmas_completions WHEN NEW.player='p104' BEGIN SELECT RAISE(ABORT,'test rollback'); END;");
      await assert.rejects(feed('p104'), /test rollback/);
      assert.equal((await db.prepare('SELECT fed FROM christmas_wallets WHERE player=?').bind('p104').first()).fed, 99);
      assert.equal((await db.prepare('SELECT count(*) AS n FROM christmas_ledger WHERE player=?').bind('p104').first()).n, 0);
      sql.exec('DROP TRIGGER fail_completion'); sql.close();
    });
    await t.test('a completion at Sunday 23:59:59.999 stays in the sealed week', async () => {
      await user('boundary106');
      const cutoff = Date.parse('2026-11-23T03:00:00Z');
      const snapshot = (await feed('boundary106', cutoff - 1)).christmas;
      assert.equal(snapshot.weekly.own.week, '2026-11-16');
      assert.equal(snapshot.weekly.own.completedAt, cutoff - 1);
      const after = (await christmasSnapshot(db, 'boundary106', cutoff)).weekly;
      assert.equal(after.week, '2026-11-23');
      assert.equal(after.remaining, 100);
      assert.equal(after.own.week, '2026-11-16');
      assert.equal(after.eligible, false);
    });
    await t.test('Monday opens fresh places, preserves progress and old winners, never re-enters a loser', async () => {
      const monday = Date.parse('2026-11-23T03:00:00Z');
      const before = (await christmasSnapshot(db, 'p103', monday - 1)).weekly;
      assert.equal(before.remaining, 0);
      const newWeek = (await christmasSnapshot(db, 'p103', monday)).weekly;
      assert.equal(newWeek.remaining, 100);
      await db.prepare('UPDATE christmas_wallets SET feed=1 WHERE player=?').bind('p103').run();
      const completed = (await feed('p103', monday)).christmas;
      assert.equal(completed.wallet.fed, 100);
      assert.equal(completed.weekly.own.rank, 1);
      assert.equal(completed.weekly.own.week, '2026-11-23');
      assert.equal((await christmasSnapshot(db, 'p1', monday)).weekly.eligible, true);
      await claim('p1', monday);
      assert.equal((await christmasSnapshot(db, 'p101', monday)).weekly.eligible, false);
      assert.equal((await christmasSnapshot(db, 'p101', monday)).weekly.own.week, '2026-11-16');
      await assert.rejects(feed('p101', monday), /turkeyGrown/);
      await assert.rejects(claim('p101', monday), /weeklyNotQualified/);
      const history = (await christmasAction(db, 'p103', { op: 'christmasLeaderboard', week: '2026-11-16' }, monday)).leaderboard;
      assert.equal(history.closed, true);
      assert.equal(history.entries.length, 100);
      assert.equal(history.own.week, '2026-11-23');
      await assert.rejects(christmasAction(db, 'p103', { op: 'christmasLeaderboard', week: '2026-11-24' }, monday), /invalidWeek/);
      await assert.rejects(christmasAction(db, 'p103', { op: 'christmasLeaderboard', week: '2026-11-30' }, monday), /invalidWeek/);
    });
    await t.test('preview slots never consume official places and changing the goal cannot revoke earned eligibility', async () => {
      await user('preview105', 99, 1, true);
      const previewNow = Date.parse('2026-10-25T03:00:00Z');
      const result = (await feed('preview105', previewNow)).christmas;
      assert.equal(result.weekly.own.rank, 1);
      assert.equal(result.config.preview, true);
      await db.prepare("UPDATE christmas_settings SET data=? WHERE id='natal-2026'").bind(JSON.stringify({ ...settings, growthGoal: 200 })).run();
      assert.equal((await christmasSnapshot(db, 'p103', now + 86400000)).weekly.eligible, true);
      assert.ok((await claim('p103', now + 86400000)).christmas.claim);
      const registeredBoard = (await christmasAction(db,'p103',{op:'christmasLeaderboard'},now+86400000)).leaderboard;
      assert.equal(registeredBoard.hasClaim,true);
    });
  } finally { closeDatabase(); await rm(dir, { recursive: true, force: true }); }
});

test('migration reconstructs historical completion time and quarantines unknown history', async () => {
  const db = new DatabaseSync(':memory:');
  const root = new URL('../backend/src/migrations/', import.meta.url);
  try {
    for (const name of (await readdir(root)).filter(n => n.endsWith('.sql') && n < '0006').sort()) db.exec(await readFile(new URL(name, root), 'utf8'));
    for (const id of ['old1', 'old2', 'unknown', 'claimed']) {
      db.prepare('INSERT INTO sessions(id,token,name,seen) VALUES(?,?,?,0)').run(id,id+'token',id);
      db.prepare('INSERT INTO christmas_wallets(id,campaign,player,fed) VALUES(?,?,?,100)').run(id,'natal-2026-live',id);
    }
    const time = Date.parse('2026-11-22T23:59:00-03:00');
    for (const [id, at] of [['old1',time],['old2',time+1]]) db.prepare("INSERT INTO christmas_ledger(id,wallet,campaign,player,kind,points_delta,feed_delta,fed_delta,wallet_version,created) VALUES(?,?,?,?,'feed',0,-100,100,0,?)").run('feed-'+id,id,'natal-2026-live',id,at);
    db.prepare("INSERT INTO christmas_claims(id,campaign,wallet,player,name,contact,contact_key,status,created,updated) VALUES('prior','natal-2026-live','claimed','claimed','Name','private','private-key','approved',?,?)").run(time,time);
    db.exec(await readFile(new URL('0006_weekly_completions.sql', root), 'utf8'));
    assert.equal(db.prepare('SELECT count(*) AS n FROM christmas_completions').get().n, 4);
    const old = db.prepare("SELECT * FROM christmas_completions WHERE player='old1'").get();
    assert.equal(old.week_start, '2026-11-16'); assert.equal(old.position,1); assert.equal(old.completed_at,time);
    assert.equal(db.prepare("SELECT position FROM christmas_completions WHERE player='old2'").get().position,2);
    const unknown = db.prepare("SELECT * FROM christmas_completions WHERE player='unknown'").get();
    assert.equal(unknown.source,'legacy_unknown'); assert.equal(unknown.position,null);
    assert.equal(db.prepare("SELECT status FROM christmas_claims WHERE id='prior'").get().status,'approved');
  } finally { db.close(); }
});

test('HTTP leaderboard is public for visitors and keeps authenticated envelopes compatible', () => setup(async c => {
  const user = await c.user('Leaderboard user');
  const guest = await request(c.base, '/v1/game', null, { op:'christmasLeaderboard' });
  assert.equal(guest.status,200);
  assert.equal(guest.data.leaderboard.limit,100);
  assert.ok(Array.isArray(guest.data.leaderboard.entries));
  assert.equal(guest.data.leaderboard.own,null);
  const privateOp = await request(c.base, '/v1/game', null, { op:'profile' });
  assert.equal(privateOp.status,401);
  const response = await request(c.base,'/v1/game',user,{op:'christmasLeaderboard'});
  assert.equal(response.status,200);
  assert.equal(response.data.leaderboard.limit,100);
  assert.ok(Array.isArray(response.data.leaderboard.entries));
  const invalid = await request(c.base,'/v1/game',user,{op:'christmasLeaderboard',week:'2026-99-99'});
  assert.equal(invalid.status,400);
}));

test('native leaderboard displays own qualification, navigates history, and ignores stale responses', async () => {
  const n = native({autoLogin:false});
  try {
    const features = n.load('utils/features');
    features.leaderboard = true; features.prize = true;
    n.app.globalData.lang='zh'; n.app.globalData.session={id:'me'};
    const now = Date.parse('2026-11-24T12:00:00Z'); const week = brasiliaWeek(now);
    const board = {now,week:week.key,currentWeek:week.key,startsAt:week.start,endsAt:week.end,limit:100,remaining:99,completed:1,eligible:true,own:{rank:1,week:week.key},previousWeek:'2026-11-16',nextWeek:null,entries:[{rank:1,name:'Ana',completedAt:now,isMe:1}]};
    n.respond(o => o.data.op === 'christmas'
      ? {christmas:{config:{growthGoal:100,canClaim:true,canEarn:true,now},wallet:{fed:100,points:0,feed:0},pet:{status:'hatched'},claim:null,weekly:{week:week.key,own:{rank:1,week:week.key},eligible:true,hasClaim:false}}}
      : {leaderboard:board});
    const page=n.page('leaderboard'); page.onLoad(); page.onShow(); await flush();
    assert.match(page.data.weeklyView.weeklyStatus,/立即申领/);
    assert.equal(page.data.entries[0].time,'09:00:00');
    assert.equal(page.data.join.action,'claim');
    page.claim(); assert.equal(n.calls.at(-1).url,'/pages/claim/index');
    n.respond(o => o.data.op === 'christmas'
      ? {christmas:{config:{growthGoal:100,canClaim:true,canEarn:true,now},wallet:{fed:100,points:0,feed:0},pet:{status:'hatched'},claim:null,weekly:{week:week.key,own:{rank:1,week:week.key},eligible:true,hasClaim:false}}}
      : {leaderboard:{...board,week:JSON.parse(JSON.stringify(o.data)).week || week.key,closed:true,nextWeek:week.key,previousWeek:null}});
    await page.previous(); assert.equal(page.data.board.week,'2026-11-16');
    const snap = {config:{growthGoal:100,canClaim:true,canEarn:true,now},wallet:{fed:100,points:0,feed:0},pet:{status:'hatched'},claim:null,weekly:{week:week.key,own:{rank:1,week:week.key},eligible:true,hasClaim:false}};
    let deliver;
    const gate = new Promise(resolve => { deliver = resolve; });
    n.respond(() => gate);
    const stale = page.refresh(); await flush();
    n.respond(o => o.data.op === 'christmas'
      ? {christmas:snap}
      : {leaderboard:{...board,week:JSON.parse(JSON.stringify(o.data)).week || week.key,closed:true,nextWeek:week.key,previousWeek:null}});
    await page.current();
    deliver({leaderboard:{...board,week:'2026-11-16',closed:true},christmas:null});
    await stale;
    assert.equal(page.data.board.week,week.key);
    page.onHide(); assert.equal(n.timerCount(),0);
    const saved=page.data.board;
    await page.refresh(); assert.equal(page.data.board,saved);
  } finally {n.dispose();}
});

test('weekly board is visible to visitors and unfinished players with a grow shortcut', async () => {
  const n = native({autoLogin:false});
  try {
    const features = n.load('utils/features');
    features.leaderboard = true; features.prize = true;
    const now = Date.parse('2026-11-24T12:00:00Z'), week = brasiliaWeek(now);
    const board = {now,week:week.key,currentWeek:week.key,startsAt:week.start,endsAt:week.end,limit:100,remaining:100,completed:0,eligible:false,own:null,canEarn:true,phase:'live',previousWeek:null,nextWeek:null,entries:[]};
    n.app.globalData.lang='zh';
    n.respond(o => o.data.op === 'christmasLeaderboard' ? {leaderboard:board} : {christmas:null});
    const page=n.page('leaderboard'); page.onLoad(); page.onShow(); await flush();
    assert.equal(page.data.loading,false);
    assert.equal(page.data.board.remaining,100);
    assert.equal(page.data.join.action,'signin');
    page.joinAction();
    assert.ok(n.calls.some(c => c.type === 'reLaunch' && c.url === '/pages/lobby/index'));
    n.app.globalData.session={id:'me',name:'Ana'};
    n.respond(o => o.data.op === 'christmasLeaderboard' ? {leaderboard:board} : {christmas:{config:{growthGoal:100,canClaim:true,canEarn:true,now},wallet:{fed:12,points:0,feed:3},pet:{status:'hatched'},claim:null,weekly:{week:week.key,own:null,eligible:false,remaining:100,hasClaim:false}}});
    await page.refresh();
    assert.equal(page.data.join.action,'grow');
    page.joinAction();
    assert.equal(n.calls.at(-1).url,'/pages/farm/index?focus=pet');
    page.onHide(); assert.equal(n.timerCount(),0);
  } finally {n.dispose();}
});
