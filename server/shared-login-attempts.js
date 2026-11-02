import { createHmac } from 'node:crypto';
export function createSharedLoginAttempts(pool, secret) {
  const keyFor = (ip) => createHmac('sha256', secret).update(ip).digest('hex');
  return {
    async retryAfter(ip) {
      const { rows } = await pool.query(
        `SELECT GREATEST(0,ceil(extract(epoch FROM blocked_until-now())))::integer AS seconds FROM eurolight_login_attempts WHERE key=$1`,
        [keyFor(ip)],
      );
      return rows[0]?.seconds || 0;
    },
    async fail(ip) {
      // The conflict lock serializes failures from every Vercel instance.
      const { rows } = await pool.query(
        `INSERT INTO eurolight_login_attempts AS a (key,failures) VALUES ($1,1)
                ON CONFLICT (key) DO UPDATE SET
                failures=CASE WHEN a.blocked_until <= now() THEN 1 WHEN a.blocked_until > now() THEN a.failures ELSE a.failures+1 END,
                blocked_until=CASE WHEN a.blocked_until > now() THEN a.blocked_until WHEN a.blocked_until <= now() THEN NULL WHEN a.failures+1 >= 5 THEN now()+interval '90 seconds' ELSE NULL END,
                updated_at=now()
                RETURNING GREATEST(0,ceil(extract(epoch FROM blocked_until-now())))::integer AS seconds`,
        [keyFor(ip)],
      );
      return rows[0].seconds;
    },
    async reset(ip) {
      await pool.query('DELETE FROM eurolight_login_attempts WHERE key=$1', [keyFor(ip)]);
    },
  };
}
