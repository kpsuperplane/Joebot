/*
  Warnings:

  - You are about to drop the column `shortname` on the `Event` table. All the data in the column will be lost.
  - Added the required column `channel_id` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "start" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL
);
INSERT INTO "new_Event" ("description", "guild_id", "id", "location", "start", "title") SELECT "description", "guild_id", "id", "location", "start", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
