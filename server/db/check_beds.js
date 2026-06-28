const db = require('./connection');

async function checkBeds() {
  try {
    const res = await db.query(`
      SELECT p.id, p.name, pv.colour_name, pv.images
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.category = 'Bed'
      ORDER BY p.id, pv.id
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
  }
}

checkBeds();
