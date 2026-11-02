import { createPool } from '../server/db.js';
import { createApp } from '../server/app.js';

// Reuse the pool across invocations of the same Vercel Function instance.
export default createApp(createPool());
