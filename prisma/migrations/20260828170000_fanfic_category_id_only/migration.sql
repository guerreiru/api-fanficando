-- A categoria da fanfic passa a existir só como FK para "categories".
-- A coluna denormalizada "category" permitia divergir do relacionamento
-- (nome renomeado na categoria, grafia diferente, categoria inexistente).

-- Backfill: aproveita o nome em texto de quem ainda não tem FK.
UPDATE "fanfics" AS f
SET "category_id" = c."id"
FROM "categories" AS c
WHERE f."category_id" IS NULL
  AND f."category" IS NOT NULL
  AND lower(btrim(f."category")) = lower(c."name");

-- Cria as categorias que só existiam como texto, para não perder a informação.
INSERT INTO "categories" ("id", "name")
SELECT gen_random_uuid(), btrim(f."category")
FROM "fanfics" AS f
WHERE f."category_id" IS NULL
  AND btrim(coalesce(f."category", '')) <> ''
GROUP BY btrim(f."category")
ON CONFLICT ("name") DO NOTHING;

UPDATE "fanfics" AS f
SET "category_id" = c."id"
FROM "categories" AS c
WHERE f."category_id" IS NULL
  AND f."category" IS NOT NULL
  AND lower(btrim(f."category")) = lower(c."name");

DROP INDEX IF EXISTS "fanfics_category_created_at_idx";
DROP INDEX IF EXISTS "fanfics_category_id_idx";

ALTER TABLE "fanfics" DROP COLUMN "category";

CREATE INDEX "fanfics_category_id_created_at_idx" ON "fanfics"("category_id", "created_at" DESC);
