/*
  Warnings:

  - You are about to drop the column `imageUrls` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `mathEnabled` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `stem` on the `questions` table. All the data in the column will be lost.
  - You are about to alter the column `marks` on the `questions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to drop the `_ClassToNotice` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `questionText` on table `questions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `marks` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_ClassToNotice" DROP CONSTRAINT "_ClassToNotice_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClassToNotice" DROP CONSTRAINT "_ClassToNotice_B_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "imageUrls",
DROP COLUMN "mathEnabled",
DROP COLUMN "stem",
ADD COLUMN     "hasMath" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "images" TEXT[],
ALTER COLUMN "questionText" SET NOT NULL,
ALTER COLUMN "marks" SET NOT NULL,
ALTER COLUMN "marks" SET DATA TYPE INTEGER,
ALTER COLUMN "difficulty" DROP DEFAULT;

-- DropTable
DROP TABLE "_ClassToNotice";

-- CreateTable
CREATE TABLE "_NoticeToClasses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_NoticeToClasses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_NoticeToClasses_B_index" ON "_NoticeToClasses"("B");

-- AddForeignKey
ALTER TABLE "_NoticeToClasses" ADD CONSTRAINT "_NoticeToClasses_A_fkey" FOREIGN KEY ("A") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_NoticeToClasses" ADD CONSTRAINT "_NoticeToClasses_B_fkey" FOREIGN KEY ("B") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
