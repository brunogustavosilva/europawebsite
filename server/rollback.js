// Preserve the original exception even when the connection is already broken.
export async function safeRollback(client) {
  try {
    await client.query('ROLLBACK');
  } catch {
    console.error('Não foi possível executar rollback: conexão indisponível.');
  }
}
