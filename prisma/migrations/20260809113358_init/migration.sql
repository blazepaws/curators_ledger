/*
  Warnings:

  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[battleNetId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `battleNetTag` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "displayName",
ADD COLUMN     "battleNetTag" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_battleNetId_key" ON "User"("battleNetId");
