module.exports = {
  'add': `
      INSERT INTO "storage" ("title", "path", "type")
      VALUES ($title, $path, $type)
      RETURNING "item_id" AS "id";`,

  'update': `
      UPDATE "storage"
      SET "date" = NOW()
      WHERE "type" = $type AND "title" = $title;`,

  'delete': `
      DELETE FROM "storage"
      WHERE "type" = $type AND "title" = $title;`,

  'get': `
      SELECT "path", "date"
      FROM "storage"
      WHERE "type" = $type AND "title" = $title;`,

  'get-all': `
      SELECT "title", "date"
      FROM "storage"
      WHERE "type" = $type
      ORDER BY "date" DESC;`,
};
