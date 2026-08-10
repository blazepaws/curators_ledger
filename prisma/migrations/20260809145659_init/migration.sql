/*
  Warnings:

  - You are about to drop the column `character` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "character",
ADD COLUMN     "characterName" TEXT,
ADD COLUMN     "characterRealm" TEXT;

-- CreateTable
CREATE TABLE "Character" (
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "realm" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Character_pkey" PRIMARY KEY ("userId","name","realm")
);

-- CreateTable
CREATE TABLE "CharacterTag" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "characterName" TEXT NOT NULL,
    "characterRealm" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "CharacterTag_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterTag" ADD CONSTRAINT "CharacterTag_userId_characterName_characterRealm_fkey" FOREIGN KEY ("userId", "characterName", "characterRealm") REFERENCES "Character"("userId", "name", "realm") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_characterName_characterRealm_fkey" FOREIGN KEY ("userId", "characterName", "characterRealm") REFERENCES "Character"("userId", "name", "realm") ON DELETE RESTRICT ON UPDATE CASCADE;
