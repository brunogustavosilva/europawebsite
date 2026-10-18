import dotenv from 'dotenv';

// Variáveis do ambiente de hospedagem têm precedência sobre arquivos locais.
dotenv.config({ path: ['.env.local', '.env'], quiet: true });
