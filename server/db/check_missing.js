const db = require('./connection');

async function checkMissing() {
  const query = `
    SELECT p.id, p.name, p.category, pv.colour_name, pv.images
    FROM products p
    JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.name ILIKE '%Avon%'
       OR p.name ILIKE '%Slumber%'
       OR p.name ILIKE '%Nordic%'
       OR p.name ILIKE '%EcoWash%'
       OR p.name ILIKE '%Smart Inverter%'
       OR p.name ILIKE '%Imperial%'
       OR p.name ILIKE '%Novella%'
       OR p.name ILIKE '%Urban Space%'
       OR p.name ILIKE '%Eco-Pine%'
       OR p.name ILIKE '%Verona%'
       OR p.name ILIKE '%IntelliWash%'
       OR p.name ILIKE '%Apex%'
       OR p.name ILIKE '%LiteWash%'
       OR p.name ILIKE '%Quantum%'
       OR p.name ILIKE '%ProClean%'
       OR p.name ILIKE '%FrostFree%'
       OR p.name ILIKE '%ArcticInverter%'
       OR p.name ILIKE '%Cyclone%'
    LIMIT 30
  `;

  try {
    const res = await db.query(query);
    console.log('Query results:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await db.pool.end();
  }
}

checkMissing();
