ALTER TABLE eurolight_equipment
    ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
    ADD COLUMN IF NOT EXISTS unit_cost numeric(12,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    ADD COLUMN IF NOT EXISTS voltage text NOT NULL DEFAULT 'bivolt' CHECK (voltage IN ('110', '220', 'bivolt')),
    ADD COLUMN IF NOT EXISTS tag text NOT NULL DEFAULT 'visual' CHECK (tag IN ('visual', 'imagem', 'som', 'audio', 'estrutural'));

CREATE TABLE IF NOT EXISTS eurolight_rentals (
    id uuid PRIMARY KEY,
    customer_name text NOT NULL,
    phone text NOT NULL,
    address text NOT NULL DEFAULT '',
    rental_date date NOT NULL CHECK (EXTRACT(ISODOW FROM rental_date) IN (1,5,6,7)),
    occupied_from date GENERATED ALWAYS AS (rental_date - ((EXTRACT(ISODOW FROM rental_date)::integer + 2) % 7)) STORED,
    total numeric(12,2) NOT NULL CHECK (total >= 0),
    deposit numeric(12,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0 AND deposit <= total),
    delivery boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'prevista' CHECK (status IN ('prevista','concluida','cancelada')),
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS eurolight_rentals_date_idx ON eurolight_rentals (rental_date, status);

CREATE TABLE IF NOT EXISTS eurolight_rental_items (
    rental_id uuid NOT NULL REFERENCES eurolight_rentals(id),
    equipment_id text NOT NULL REFERENCES eurolight_equipment(id),
    name text NOT NULL,
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity integer NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (rental_id, equipment_id)
);
CREATE INDEX IF NOT EXISTS eurolight_rental_items_equipment_idx ON eurolight_rental_items (equipment_id);

-- A proteção dos meses encerrados também vale para escritas diretas no banco.
CREATE OR REPLACE FUNCTION eurolight_lock_closed_rental() RETURNS trigger AS $$
DECLARE month_start date := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.rental_date < month_start THEN
        RAISE EXCEPTION 'Mês encerrado: locações não podem ser alteradas.' USING ERRCODE = '23514';
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.rental_date < month_start THEN
        RAISE EXCEPTION 'Não é permitido cadastrar locações em meses encerrados.' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER eurolight_rentals_closed_guard
BEFORE INSERT OR UPDATE OR DELETE ON eurolight_rentals
FOR EACH ROW EXECUTE FUNCTION eurolight_lock_closed_rental();

CREATE OR REPLACE FUNCTION eurolight_lock_closed_items() RETURNS trigger AS $$
DECLARE month_start date := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') AND EXISTS (
        SELECT 1 FROM eurolight_rentals WHERE id = OLD.rental_id AND rental_date < month_start
    ) THEN
        RAISE EXCEPTION 'Mês encerrado: itens não podem ser alterados.' USING ERRCODE = '23514';
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') AND EXISTS (
        SELECT 1 FROM eurolight_rentals WHERE id = NEW.rental_id AND rental_date < month_start
    ) THEN
        RAISE EXCEPTION 'Mês encerrado: itens não podem ser alterados.' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER eurolight_rental_items_closed_guard
BEFORE INSERT OR UPDATE OR DELETE ON eurolight_rental_items
FOR EACH ROW EXECUTE FUNCTION eurolight_lock_closed_items();
