-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT
);
INSERT INTO "new_Guild" ("category", "id") SELECT "category", "id" FROM "Guild";
DROP TABLE "Guild";
ALTER TABLE "new_Guild" RENAME TO "Guild";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
