const fs = require('fs');
const path = require('path');

const categories = [
  { name: 'Sofa', count: 12, minBuy: 8000, maxBuy: 65000, minRent: 800, maxRent: 3500 },
  { name: 'Bed', count: 12, minBuy: 10000, maxBuy: 80000, minRent: 900, maxRent: 4000 },
  { name: 'Dining Table', count: 8, minBuy: 6000, maxBuy: 40000, minRent: 600, maxRent: 2500 },
  { name: 'Chair', count: 10, minBuy: 2000, maxBuy: 20000, minRent: 300, maxRent: 1200 },
  { name: 'Wardrobe', count: 8, minBuy: 8000, maxBuy: 55000, minRent: 700, maxRent: 3000 },
  { name: 'Washing Machine', count: 8, minBuy: 12000, maxBuy: 55000, minRent: 900, maxRent: 3500 },
  { name: 'Refrigerator', count: 8, minBuy: 15000, maxBuy: 75000, minRent: 1000, maxRent: 4500 },
  { name: 'AC', count: 8, minBuy: 25000, maxBuy: 90000, minRent: 1500, maxRent: 5000 },
  { name: 'TV', count: 8, minBuy: 12000, maxBuy: 120000, minRent: 800, maxRent: 5500 },
  { name: 'Office Desk', count: 8, minBuy: 4000, maxBuy: 25000, minRent: 400, maxRent: 1800 },
  { name: 'Mattress', count: 6, minBuy: 5000, maxBuy: 40000, minRent: 500, maxRent: 2000 },
  { name: 'Coffee Table', count: 4, minBuy: 3000, maxBuy: 18000, minRent: 300, maxRent: 1000 }
];

const brands = ['WoodCraft', 'HomeBazaar', 'RoyalOak', 'Nilkamal', 'UrbanLadder', 'Durian', 'FurnitureMart', 'DécorHome'];
const materials = ['Teak Wood', 'Sheesham Wood', 'Engineered Wood', 'Premium Fabric', 'Leatherette', 'Metal & Alloy', 'MDF', 'Tempered Glass'];
const conditions = ['new', 'like_new', 'refurbished'];

const colors = [
  { name: 'Walnut', hex: '#5C4033' },
  { name: 'Oak', hex: '#B8860B' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Forest Green', hex: '#228B22' }
];

const categoryImages = {
  'Sofa': [
    'photo-1555041469-a586c61ea9bc',
    'photo-1493663284031-b7e3aefcae8e',
    'photo-1586023492125-27b2c045efd7',
    'photo-1484101403633-562f891dc89a',
    'photo-1618220179428-22790b461013',
    'photo-1600121848594-d8644e57abab',
    'photo-1618219908412-a29a1bb7b86e',
    'photo-1549488344-1f9b8d2bd1f3',
    'photo-1567016432779-094069958ea5',
    'photo-1583847268964-b28dc8f51f92',
    'photo-1550581190-9c1c48d21d6c',
    'photo-1605371924599-2d0365da1ae0',
    'photo-1506898667547-42e22a46e125',
    'photo-1524758631624-e2822e304c36'
  ],
  'Bed': [
    'photo-1505693416388-ac5ce068fe85',
    'photo-1540518614846-7eded433c457',
    'photo-1598928506311-c55ded91a20c',
    'photo-1522771739844-6a9f6d5f14af',
    'photo-1566665797739-1674de7a421a',
    'photo-1595428774223-ef52624120d2',
    'photo-1616486338812-3dadae4b4ace',
    'photo-1631049307264-da0ec9d70304',
    'photo-1583847268964-b28dc8f51f92',
    'photo-1507652313519-d4e9174996dd',
    'photo-1590381105924-c72589b9ef3f',
    'photo-1616594039964-ae9021a400a0',
    'photo-1502672260266-1c1ef2d93688',
    'photo-1600210492486-724fe5c67fb0'
  ],
  'Dining Table': [
    'photo-1615066390971-03e4e1c36ddf',
    'photo-1577140917170-285929fb55b7',
    'photo-1595515106969-1ce29566ff1c',
    'photo-1604014237800-1c9102c219da',
    'photo-1544816155-12df9643f363',
    'photo-1590381105924-c72589b9ef3f',
    'photo-1533090161767-e6ffed986c88',
    'photo-1565793298595-6a879b1d9492',
    'photo-1581428982868-e410dd047a90',
    'photo-1600607687939-ce8a6c25118c'
  ],
  'Chair': [
    'photo-1567538096630-e0c55bd6374c',
    'photo-1592078615290-033ee584e267',
    'photo-1506439773649-6e0eb8cfb237',
    'photo-1580481072645-022f9a6dbf27',
    'photo-1501876725168-00c445821c9e',
    'photo-1586158291800-2665f07bba79',
    'photo-1503602642458-232111445657',
    'photo-1505797149-43b0069ec26b',
    'photo-1598300042247-d088f8ab3a91',
    'photo-1581428982868-e410dd047a90',
    'photo-1592078615290-033ee584e267'
  ],
  'Wardrobe': [
    'photo-1602810318383-e386cc2a3ccf',
    'photo-1595428774223-ef52624120d2',
    'photo-1616486338812-3dadae4b4ace',
    'photo-1600566753190-17f0baa2a6c3',
    'photo-1600585154526-990dced4db0d',
    'photo-1502672260266-1c1ef2d93688',
    'photo-1600210492486-724fe5c67fb0',
    'photo-1616594039964-ae9021a400a0'
  ],
  'Washing Machine': [
    'photo-1626806787461-102c1bfaaea1',
    'photo-1581578731548-c64695cc6952',
    'photo-1584622781564-1d987f7333c1',
    'photo-1528190336454-13cd56b45b5a',
    'photo-1545241047-6083a3684587',
    'photo-1551739440-5dd934d3a94a',
    'photo-1545241047-6083a3684587',
    'photo-1588854337236-6889d631faa8'
  ],
  'Refrigerator': [
    'photo-1584622650111-993a426fbf0a',
    'photo-1588854337236-6889d631faa8',
    'photo-1600607687920-4e2a09cf159d',
    'photo-1600585154340-be6161a56a0c',
    'photo-1560518883-ce09059eeffa',
    'photo-1573865526739-10659fec78a5',
    'photo-1573865526739-10659fec78a5',
    'photo-1556911220-e15b29be8c8f'
  ],
  'AC': [
    'photo-1563720223185-11003d516935',
    'photo-1605647540924-852290f6b0d5',
    'photo-1621905251189-08b45d6a269e',
    'photo-1527689368864-3a821dbccc34',
    'photo-1585338107529-13afc5f02586',
    'photo-1525498128493-380d1990a112',
    'photo-1595950653106-6c9ebd614d3a',
    'photo-1560169897-fc0cdbdfa4d5'
  ],
  'TV': [
    'photo-1593305841991-05c297ba4575',
    'photo-1461151304267-38535e780c79',
    'photo-1593789198777-f29bc259780e',
    'photo-1552975084-6e027cd345c2',
    'photo-1595950653106-6c9ebd614d3a',
    'photo-1560169897-fc0cdbdfa4d5',
    'photo-1593305841991-05c297ba4575',
    'photo-1593789198777-f29bc259780e'
  ],
  'Office Desk': [
    'photo-1524758631624-e2822e304c36',
    'photo-1518455027359-f3f8164ba6bd',
    'photo-1493934558415-9d19f0b2b4d2',
    'photo-1505797149-43b0069ec26b',
    'photo-1593642632823-8f785ba67e45',
    'photo-1519389950473-47ba0277781c',
    'photo-1499750310107-5fef28a66643',
    'photo-1513151233558-d860c5398176'
  ],
  'Mattress': [
    'photo-1631049307264-da0ec9d70304',
    'photo-1583847268964-b28dc8f51f92',
    'photo-1616046229478-9901c5536a45',
    'photo-1522771739844-6a9f6d5f14af',
    'photo-1540518614846-7eded433c457',
    'photo-1505693416388-ac5ce068fe85'
  ],
  'Coffee Table': [
    'photo-1533090161767-e6ffed986c88',
    'photo-1565793298595-6a879b1d9492',
    'photo-1581428982868-e410dd047a90',
    'photo-1600607687939-ce8a6c25118c'
  ]
};

const productNamesByCategory = {
  'Sofa': [
    'Elysian Velvet Sofa', 'Chesterfield Royal Sofa', 'Nouveau Fabric Recliner', 'Scandi Minimalist Sofa',
    'Mansion Leatherette Sofa', 'Zenith 3-Seater Sofa', 'Solace L-Shaped Sectional', 'Vanguard Chesterfield Sofa',
    'Monarch Velvet Loveseat', 'Hampton Space Sofa Bed', 'Sovereign Classic Recliner', 'Cascade Sleek Corner Sofa'
  ],
  'Bed': [
    'Marlow Queen Wooden Bed', 'Kingston King Bed with Storage', 'Platform Minimalist Bed', 'Imperial Classic Poster Bed',
    'Novella Premium Single Bed', 'Tuscany Hydraulic Lift Bed', 'Aura Luxury Canopy Bed', 'Slumber Low Platform Bed',
    'Oasis Solid Teak Bed', 'Urban Space-Saver Single Bed', 'Regal Velvet Upholstered Bed', 'Eco-Pine Foldable Bed'
  ],
  'Dining Table': [
    'Verona 6-Seater Table', 'Nordic 4-Seater Dining Set', 'Prism Glass Dining Table', 'Heritage Sheesham Table',
    'Avon Folding Dining Desk', 'Tuscan Rustic Banquet Table', 'Sleek Compact Bistro Table', 'Imperial Marble-Top Table'
  ],
  'Chair': [
    'Ego Ergonomic Office Chair', 'Accent Wingback Armchair', 'Iconic Wooden Rocking Chair', 'Flex Task Swivel Chair',
    'Regal Dining Chair (Set of 2)', 'Alpine Lounge Recliner', 'Bistro Metallic Bar Stool', 'Danish Retro Study Chair',
    'Cushioned Easy Armchair', 'Urban Plastic Stackable Chair'
  ],
  'Wardrobe': [
    'Klassic 3-Door Wardrobe', 'Slider Contemporary Wardrobe', 'Linear Minimalist Almirah', 'Estate Walk-in Closet Organizer',
    'Nordic 2-Door Wardrobe', 'Monarch Mirror Wooden Closet', 'Nova Compact Armoire', 'Vanguard Heavy-Duty Almirah'
  ],
  'Washing Machine': [
    'HydroClean 8kg Front Load', 'EcoWash 7kg Top Load', 'TurboSpin Semi-Automatic', 'IntelliWash Smart Front Load',
    'Apex 9kg Dry-Wash System', 'LiteWash Compact Washing Machine', 'Quantum Inverter Washing Machine', 'ProClean Steam Sanitizer'
  ],
  'Refrigerator': [
    'FrostFree Double Door 260L', 'DirectCool Single Door 190L', 'SideBySide Neo Refrigerator 580L', 'MultiZone French Door 420L',
    'AeroFresh Triple Door Refrigerator', 'MiniBar Compact Refrigerator 50L', 'SmartInverter Refrigerator 320L', 'ChefClassic Pro Refrigerator 600L'
  ],
  'AC': [
    'ArcticInverter 1.5 Ton Split AC', 'Cyclone 1 Ton Window AC', 'PolarBlast 2 Ton 5-Star Split AC', 'SmartChill 1.5 Ton Inverter AC',
    'EcoBreeze 1.2 Ton Split AC', 'SilentWind Window AC 1.5 Ton', 'Apex Tower AC 2.5 Ton', 'FrostTech Smart Connected AC'
  ],
  'TV': [
    'UltraSight 55-inch 4K Smart TV', 'NeoVision 43-inch Full HD TV', 'OLED CinemaPro 65-inch TV', 'Compact Vision 32-inch LED TV',
    'SuperSensation 75-inch 8K TV', 'FlexStream 50-inch UHD Android TV', 'VisionMax 43-inch Bezel-Less TV', 'CinemaShield Curved 55-inch TV'
  ],
  'Office Desk': [
    'ErgoRise Height Adjustable Desk', 'Sturdy Oak Study Desk', 'Zenith Executive Office Desk', 'Urban Compact Writing Desk',
    'Cornerstone L-Shaped Desk', 'Vanguard Computer Workstation', 'Nordic Minimalist Study Table', 'Prism Glass Office Table'
  ],
  'Mattress': [
    'OrthoComfort Memory Foam Mattress', 'SlumberLatex Organic Mattress', 'SpringSpine Pocket Spring Mattress', 'DualComfort Coir Mattress',
    'Premium Gel-Infused Foam Mattress', 'ErgoRest Hybrid Mattress'
  ],
  'Coffee Table': [
    'Centrum Nesting Coffee Tables', 'Sheesham Wood Coffee Table', 'Urban Glass-Top Center Table', 'Vintage Storage Coffee Table'
  ]
};

// Generates seed script
let sql = `-- Seed data for RentEase (PostgreSQL)\n\n`;

// Pre-calculated bcrypt hash for password 'Rentease@123' (salt rounds = 10)
const adminPasswordHash = '$2a$10$WdZ5X9M6hK/Rj4rT1W1n1e/gP1eO29G57N0Y9T0N4S7l6C5A8K2C.';
sql += `-- Default Users (Admin & Test User)\n`;
sql += `INSERT INTO users (name, email, password_hash, google_id, phone, profile_picture, is_new_user) VALUES \n`;
sql += `('Ritish Admin', 'ritish@rentease.in', '${adminPasswordHash}', NULL, '9876543210', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ritish', FALSE),\n`;
sql += `('Test Customer', 'customer@gmail.com', '${adminPasswordHash}', NULL, '9999988888', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Customer', TRUE);\n\n`;

// Insert promo codes
sql += `-- Promo Codes\n`;
sql += `INSERT INTO promo_codes (code, discount_type, discount_value, expiry_date, is_active) VALUES \n`;
sql += `('WELCOME200', 'flat', 200.00, '2027-12-31', TRUE),\n`;
sql += `('FESTIVE15', 'percent', 15.00, '2027-12-31', TRUE),\n`;
sql += `('EASEBUY500', 'flat', 500.00, '2027-12-31', TRUE);\n\n`;

sql += `-- 100 Products and Variant Seeds\n`;

let productIdx = 1;
for (const cat of categories) {
  const names = productNamesByCategory[cat.name];
  for (let i = 0; i < cat.count; i++) {
    const name = names[i] || `${cat.name} Premium Model ${i + 1}`;
    const brand = brands[i % brands.length];
    const material = materials[i % materials.length];
    const condition = conditions[i % conditions.length];
    
    // Scale prices
    const buyPrice = Math.round(cat.minBuy + (cat.maxBuy - cat.minBuy) * (i / (cat.count - 1 || 1)));
    const rentMonth = Math.round(cat.minRent + (cat.maxRent - cat.minRent) * (i / (cat.count - 1 || 1)));
    const rentWeek = Math.round(rentMonth / 4);
    
    const desc = `Introduce modern luxury and functionality to your space with the ${name} by ${brand}. Crafted from high-quality ${material}, it is designed for both exceptional durability and superior comfort. Perfect for living rooms, bedrooms, or modern offices looking for an elegant touch. The sleek structure blends seamlessly with diverse aesthetics, making it a stellar addition to any home.`;
    const dimensions = `${100 + (i * 5)} x ${60 + (i * 3)} x ${45 + (i * 2)} cm`;
    const weight = `${10 + (i * 2)} kg`;
    const warranty = `${1 + (i % 3)} Year Warranty`;
    const rating = (4.0 + (i % 10) * 0.1).toFixed(1);
    const reviewCount = 5 + (i * 8);

    sql += `INSERT INTO products (id, name, brand, category, description, material, dimensions, weight, warranty, buy_price, rent_price_week, rent_price_month, rating, review_count, stock_quantity, is_available, condition_type) VALUES \n`;
    sql += `(${productIdx}, '${name}', '${brand}', '${cat.name}', '${desc.replace(/'/g, "''")}', '${material}', '${dimensions}', '${weight}', '${warranty}', ${buyPrice.toFixed(2)}, ${rentWeek.toFixed(2)}, ${rentMonth.toFixed(2)}, ${rating}, ${reviewCount}, 50, TRUE, '${condition}');\n`;

    // Variants: 4 variants per product
    sql += `INSERT INTO product_variants (product_id, colour_name, colour_hex, images, stock) VALUES \n`;
    
    const chosenColors = colors.slice(i % 5, (i % 5) + 4); // Take 4 colors dynamically
    const ids = categoryImages[cat.name] || categoryImages['Sofa'];
    
    const variantStrings = chosenColors.map((color, cIdx) => {
      // Rotate based on productIdx and color index to give different primary images for different variants
      const hash = (productIdx + cIdx) % ids.length;
      const imagesArray = [];
      for (let j = 0; j < 4; j++) {
        const imgId = ids[(hash + j) % ids.length];
        const formattedId = imgId.startsWith('photo-') ? imgId : `photo-${imgId}`;
        imagesArray.push(`https://images.unsplash.com/${formattedId}?w=800&auto=format&fit=crop&q=80`);
      }
      return `(${productIdx}, '${color.name}', '${color.hex}', '${JSON.stringify(imagesArray)}'::jsonb, 20)`;
    });

    sql += variantStrings.join(',\n') + ';\n\n';
    
    productIdx++;
  }
}

fs.writeFileSync(path.join(__dirname, 'seed.sql'), sql);
console.log('Successfully generated seed.sql with 100 products and variants!');
