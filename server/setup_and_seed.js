const fs = require('fs');
const path = require('path');
const db = require('./db/connection');
const { updateAllImages } = require('./db/update_images');

async function run() {
  try {
    console.log('Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
    
    console.log('Applying schema to database...');
    await db.query(schemaSql);
    console.log('Schema applied successfully.');

    console.log('Reading seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'db/seed.sql'), 'utf8');
    
    console.log('Applying seed data (this might take a few seconds)...');
    await db.query(seedSql);
    console.log('Database seeded successfully with 100 products and variants.');

    // Automatically update images to stable, working Unsplash URLs
    await updateAllImages();
    
    const countRes = await db.query('SELECT count(*) FROM products');
    console.log(`Verified: ${countRes.rows[0].count} products now exist in the database.`);
  } catch (err) {
    console.error('ERROR SEEDING DATABASE:', err);
  } finally {
    process.exit(0);
  }
}

run();
