-- Apply after schema-java05.sql in the intended test database.
-- Adds a table only; it does not change trips or existing profiles.
CREATE TABLE IF NOT EXISTS preferimet (
  github_id TEXT NOT NULL
    REFERENCES profilet(github_id) ON DELETE CASCADE,
  udhetim_id TEXT NOT NULL
    REFERENCES udhetimet(id) ON DELETE CASCADE,
  krijuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT preferimet_perdoruesi_udhetimi_unike
    UNIQUE (github_id, udhetim_id)
);
