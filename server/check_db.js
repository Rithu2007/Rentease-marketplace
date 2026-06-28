const db = require('./db/connection');

async function check() {
  try {
    const res = await db.query('SELECT id, name, category, buy_price, is_available, stock_quantity FROM products WHERE category = $1', ['Dining Table']);
    console.log('PRODUCTS FOUND FOR "Dining Table":', res.rows.length);
    console.log(res.rows);
    
    const countRes = await db.query('SELECT category, count(*) FROM products GROUP BY category');
    console.log('PRODUCT COUNT BY CATEGORY:', countRes.rows);
  } catch (err) {
    console.error('ERROR CHECKING DB:', err);
  } finally {
    process.exit(0);
  }
}

check();
