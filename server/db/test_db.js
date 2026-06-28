const db = require('./connection');

async function checkDoublePhotos() {
  try {
    const res = await db.query(`
      SELECT pv.id as variant_id, p.id as product_id, p.name, p.category, pv.images
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      WHERE pv.images::text LIKE '%photo-photo-%'
    `);
    console.log(`Found ${res.rows.length} variants with double photo prefix:`);
    console.log(JSON.stringify(res.rows.map(r => ({ id: r.product_id, name: r.name, category: r.category })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
  }
}

checkDoublePhotos();
