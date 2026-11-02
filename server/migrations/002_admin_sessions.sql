CREATE TABLE IF NOT EXISTS eurolight_admin_sessions (
    sid varchar PRIMARY KEY,
    sess json NOT NULL,
    expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS eurolight_admin_sessions_expire_idx
    ON eurolight_admin_sessions (expire);
