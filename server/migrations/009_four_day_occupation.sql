-- Quatro dias inclusivos: véspera, evento, dia seguinte e devolução.
-- Reservas existentes conservam o período acordado; novas reservas ou
-- alterações da data do evento passam a utilizar o novo período.
CREATE OR REPLACE FUNCTION eurolight_set_rental_period() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR NEW.rental_date IS DISTINCT FROM OLD.rental_date THEN
        NEW.occupied_from := NEW.rental_date - 1;
        NEW.occupied_until := NEW.rental_date + 2;
    ELSE
        NEW.occupied_from := OLD.occupied_from;
        NEW.occupied_until := OLD.occupied_until;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
