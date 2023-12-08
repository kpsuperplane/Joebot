/*
  Warnings:

  - Added the required column `guild_id` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "shortname" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL
);
INSERT INTO "new_Event" ("description", "id", "location", "shortname", "start", "title") SELECT "description", "id", "location", "shortname", "start", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
