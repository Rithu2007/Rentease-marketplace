const db = require('./connection');

async function checkSofas() {
  try {
    const res = await db.query(`
      SELECT id, name, category
      FROM products
      WHERE category = 'Sofa' OR name ILIKE '%Sofa%'
      ORDER BY id
    `);
    console.log('Sofa Products:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
  }
}

checkSofas();
