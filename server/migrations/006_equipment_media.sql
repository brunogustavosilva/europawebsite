ALTER TABLE eurolight_equipment
    ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '' CHECK (length(image_url) <= 2048),
    ADD COLUMN IF NOT EXISTS video_file text CHECK (length(video_file) <= 300);
-- NULL mantém a associação dos vídeos dos três equipamentos originais.
-- Uma string vazia representa a escolha explícita de não usar vídeo.
