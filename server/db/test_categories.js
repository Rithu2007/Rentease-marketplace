const db = require('./connection');

async function checkCategories() {
  try {
    const res = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
    console.log('DB Categories:');
    console.log(res.rows.map(r => r.category));
  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
  }
}

checkCategories();
