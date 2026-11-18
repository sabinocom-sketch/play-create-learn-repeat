import { createPool } from "./connection.mjs";
import { catalogSeed } from "./catalog.mjs";

const pool = createPool();
const client = await pool.connect();
try {
  await client.query("begin");
  for (const entry of catalogSeed) {
    const [productId, productCode, namePt, nameEn, type] = entry.product;
    const productResult = await client.query(`insert into products (id, code, name_pt, name_en, type) values ($1,$2,$3,$4,$5)
      on conflict (code) do update set name_pt=excluded.name_pt,name_en=excluded.name_en,type=excluded.type,updated_at=now()
      returning id`, [productId, productCode, namePt, nameEn, type]);
    const persistedProductId = productResult.rows[0].id;
    const [editionId, editionCode, locale, title] = entry.edition;
    const editionResult = await client.query(`insert into product_editions (id,product_id,edition_code,locale,title,publishable) values ($1,$2,$3,$4,$5,false)
      on conflict (product_id,edition_code) do update set locale=excluded.locale,title=excluded.title,updated_at=now()
      returning id`, [editionId, persistedProductId, editionCode, locale, title]);
    const persistedEditionId = editionResult.rows[0].id;
    const [skuId, skuCode, lessonCode, priceMinor] = entry.sku;
    await client.query(`insert into skus (id,product_edition_id,code,lesson_code,price_minor,currency) values ($1,$2,$3,$4,$5,'EUR')
      on conflict (code) do update set product_edition_id=excluded.product_edition_id,lesson_code=excluded.lesson_code,price_minor=excluded.price_minor,currency=excluded.currency,updated_at=now()`, [skuId, persistedEditionId, skuCode, lessonCode, priceMinor]);
  }
  await client.query("commit");
  console.log("Catalog seed applied successfully (4 SKUs, all non-publishable by default).");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
