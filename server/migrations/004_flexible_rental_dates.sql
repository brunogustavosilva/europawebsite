-- Mantém os períodos antigos e permite novas reservas em qualquer dia.
ALTER TABLE eurolight_rentals DROP CONSTRAINT IF EXISTS eurolight_rentals_rental_date_check;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'eurolight_rentals'::regclass AND attname = 'occupied_from' AND attgenerated = 's') THEN
        ALTER TABLE eurolight_rentals ALTER COLUMN occupied_from DROP EXPRESSION;
    END IF;
END;
$$;
ALTER TABLE eurolight_rentals ADD COLUMN IF NOT EXISTS occupied_until date;
-- A atualização técnica preserva a ocupação original inclusive nos meses fechados.
ALTER TABLE eurolight_rentals DISABLE TRIGGER eurolight_rentals_closed_guard;
UPDATE eurolight_rentals SET occupied_until = occupied_from + 3 WHERE occupied_until IS NULL;
ALTER TABLE eurolight_rentals ENABLE TRIGGER eurolight_rentals_closed_guard;
ALTER TABLE eurolight_rentals ALTER COLUMN occupied_from SET NOT NULL;
ALTER TABLE eurolight_rentals ALTER COLUMN occupied_until SET NOT NULL;
CREATE OR REPLACE FUNCTION eurolight_set_rental_period() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.rental_date IS DISTINCT FROM OLD.rental_date THEN
        NEW.occupied_from := NEW.rental_date;
        NEW.occupied_until := NEW.rental_date + 4;
    ELSE
        NEW.occupied_from := OLD.occupied_from;
        NEW.occupied_until := OLD.occupied_until;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER eurolight_rentals_period
BEFORE INSERT OR UPDATE ON eurolight_rentals
FOR EACH ROW EXECUTE FUNCTION eurolight_set_rental_period();
CREATE INDEX IF NOT EXISTS eurolight_rentals_occupation_idx ON eurolight_rentals (occupied_from, occupied_until);
