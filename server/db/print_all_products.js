const db = require('./connection');

async function printAll() {
  try {
    const res = await db.query('SELECT id, name, category FROM products ORDER BY id');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
  }
}

printAll();
