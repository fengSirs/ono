CREATE TABLE christmas_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign TEXT NOT NULL,
  player TEXT NOT NULL,
  wallet TEXT NOT NULL UNIQUE,
  week_start TEXT,
  position INTEGER,
  completed_at INTEGER,
  display_name TEXT NOT NULL,
  source TEXT NOT NULL,
  UNIQUE(campaign,player),
  UNIQUE(campaign,week_start,position),
  CHECK ((source='legacy_unknown' AND position IS NULL AND week_start IS NULL AND completed_at IS NULL)
    OR (source IN ('live','ledger') AND position>0 AND week_start IS NOT NULL AND completed_at IS NOT NULL))
);
CREATE INDEX christmas_completions_week_idx ON christmas_completions(campaign,week_start,position);
ALTER TABLE christmas_claims ADD COLUMN completion_id INTEGER;

-- Recover the first crossing from persisted feeding history, never from page visits.
-- Unknown opening balances are quarantined rather than awarded a fabricated timestamp.
WITH history AS (
  SELECT l.wallet,l.created,l.id,
    sum(l.fed_delta) OVER (PARTITION BY l.wallet ORDER BY l.created,l.id) AS cumulative,
    w.fed-(SELECT coalesce(sum(x.fed_delta),0) FROM christmas_ledger x WHERE x.wallet=w.id) AS opening,
    coalesce((SELECT json_extract(data,'$.growthGoal') FROM christmas_settings WHERE id='natal-2026'),100) AS goal
  FROM christmas_ledger l JOIN christmas_wallets w ON w.id=l.wallet WHERE l.fed_delta>0
), crossings AS (
  SELECT *,row_number() OVER (PARTITION BY wallet ORDER BY created,id) AS occurrence
  FROM history WHERE opening<goal AND opening+cumulative>=goal
), dated AS (
  SELECT w.campaign,w.player,w.id AS wallet,h.created,h.id AS ledger_id,
    date(h.created/1000.0,'unixepoch','-3 hours','-' || ((cast(strftime('%w',h.created/1000.0,'unixepoch','-3 hours') AS INTEGER)+6)%7) || ' days') AS week_start,
    coalesce(s.name,'ONO!') AS display_name
  FROM crossings h JOIN christmas_wallets w ON w.id=h.wallet LEFT JOIN sessions s ON s.id=w.player
  WHERE h.occurrence=1
)
INSERT INTO christmas_completions(campaign,player,wallet,week_start,position,completed_at,display_name,source)
SELECT campaign,player,wallet,week_start,row_number() OVER (PARTITION BY campaign,week_start ORDER BY created,ledger_id),created,display_name,'ledger' FROM dated;

INSERT OR IGNORE INTO christmas_completions(campaign,player,wallet,display_name,source)
SELECT w.campaign,w.player,w.id,coalesce(s.name,'ONO!'),'legacy_unknown'
FROM christmas_wallets w LEFT JOIN sessions s ON s.id=w.player
WHERE w.fed>=coalesce((SELECT json_extract(data,'$.growthGoal') FROM christmas_settings WHERE id='natal-2026'),100)
  OR EXISTS (SELECT 1 FROM christmas_claims c WHERE c.wallet=w.id);

UPDATE christmas_claims SET completion_id=(SELECT id FROM christmas_completions c WHERE c.wallet=christmas_claims.wallet AND c.position<=100);
