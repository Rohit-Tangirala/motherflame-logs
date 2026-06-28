import { initDb, pool } from './server/db.js';

async function test() {
  await initDb();
  if (pool) {
    const [rows] = await pool.query("SELECT id, cover_image FROM posts WHERE cover_image = 'null' OR cover_image = 'undefined'");
    console.log(rows);
  }
  process.exit(0);
}
test();
