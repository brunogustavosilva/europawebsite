ALTER TABLE eurolight_equipment ADD COLUMN IF NOT EXISTS is_kit boolean NOT NULL DEFAULT false;
ALTER TABLE eurolight_equipment ADD COLUMN IF NOT EXISTS kit_items jsonb NOT NULL DEFAULT '[]';
-- Composição congelada na locação: editar um kit não altera reservas anteriores.
ALTER TABLE eurolight_rental_items ADD COLUMN IF NOT EXISTS stock_items jsonb;
CREATE OR REPLACE VIEW eurolight_stock_demands AS
SELECT i.rental_id, part->>'equipment_id' AS equipment_id,
       i.quantity::bigint * (part->>'quantity')::bigint AS quantity
FROM eurolight_rental_items i
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(i.stock_items,
    jsonb_build_array(jsonb_build_object('equipment_id', i.equipment_id, 'quantity', 1)))) AS part;

-- Protege as referências da composição mesmo em exclusões feitas fora da API.
CREATE OR REPLACE FUNCTION eurolight_guard_kit_component_delete() RETURNS trigger AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM eurolight_equipment e WHERE e.is_kit
        AND e.kit_items @> jsonb_build_array(jsonb_build_object('equipment_id', OLD.id)))
    OR EXISTS (SELECT 1 FROM eurolight_stock_demands WHERE equipment_id = OLD.id) THEN
        RAISE EXCEPTION 'Equipamento vinculado a kits ou locações.' USING ERRCODE = '23503';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER eurolight_kit_component_delete_guard
BEFORE DELETE ON eurolight_equipment
FOR EACH ROW EXECUTE FUNCTION eurolight_guard_kit_component_delete();
