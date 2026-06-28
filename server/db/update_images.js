const db = require('./connection');

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

async function updateAllImages() {
  console.log('Starting DB image correction...');
  try {
    const { rows: variants } = await db.query(`
      SELECT pv.id, p.category, pv.colour_name, pv.product_id
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
    `);

    console.log(`Found ${variants.length} product variants to check and update.`);

    let updatedCount = 0;
    for (const v of variants) {
      const ids = categoryImages[v.category] || categoryImages['Sofa'];
      const hash = (v.product_id + v.id) % ids.length;
      
      const imagesArray = [];
      for (let j = 0; j < 4; j++) {
        const imgId = ids[(hash + j) % ids.length];
        const formattedId = imgId.startsWith('photo-') ? imgId : `photo-${imgId}`;
        imagesArray.push(`https://images.unsplash.com/${formattedId}?w=800&auto=format&fit=crop&q=80`);
      }

      await db.query(
        'UPDATE product_variants SET images = $1::jsonb WHERE id = $2',
        [JSON.stringify(imagesArray), v.id]
      );
      updatedCount++;
    }
    console.log(`Successfully updated ${updatedCount} product variant images with stable, working Unsplash URLs!`);
  } catch (err) {
    console.error('Failed to update product variant images:', err);
  }
}

if (require.main === module) {
  updateAllImages().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { updateAllImages };
