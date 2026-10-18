ALTER TABLE eurolight_rentals ADD COLUMN IF NOT EXISTS cpf text
    CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');
