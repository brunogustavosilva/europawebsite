CREATE TABLE IF NOT EXISTS eurolight_login_attempts (
    key text PRIMARY KEY,
    failures integer NOT NULL DEFAULT 0,
    blocked_until timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eurolight_login_attempts_updated_idx ON eurolight_login_attempts(updated_at);
ALTER TABLE eurolight_rentals ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE eurolight_equipment ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
CREATE OR REPLACE FUNCTION eurolight_increment_version() RETURNS trigger AS $$
BEGIN
    NEW.version := OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER eurolight_rental_version BEFORE UPDATE ON eurolight_rentals
FOR EACH ROW EXECUTE FUNCTION eurolight_increment_version();
CREATE OR REPLACE TRIGGER eurolight_equipment_version BEFORE UPDATE ON eurolight_equipment
FOR EACH ROW EXECUTE FUNCTION eurolight_increment_version();
