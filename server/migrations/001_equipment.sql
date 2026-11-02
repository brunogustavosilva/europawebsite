CREATE TABLE IF NOT EXISTS eurolight_equipment (
    id text PRIMARY KEY,
    nome text NOT NULL,
    descricao text NOT NULL,
    ideal text NOT NULL,
    preco numeric(10, 2) NOT NULL CHECK (preco >= 0),
    periodo text NOT NULL,
    popularidade integer NOT NULL DEFAULT 0,
    categorias text[] NOT NULL DEFAULT '{}'
);
