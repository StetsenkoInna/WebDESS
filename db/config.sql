CREATE TYPE ITEM_TYPE AS ENUM ('Net', 'Model');

CREATE TABLE "storage" (
  "item_id" SERIAL      NOT NULL,
  "title"   VARCHAR(50) NOT NULL,
  "path"    VARCHAR(50) NOT NULL,
  "type"    ITEM_TYPE   NOT NULL DEFAULT 'Net',
  "date"    TIMESTAMP   NOT NULL DEFAULT NOW(),

  PRIMARY KEY("item_id"),
  UNIQUE("title")
);
