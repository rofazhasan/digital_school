-- DropForeignKey
ALTER TABLE "exam_sets" DROP CONSTRAINT "exam_sets_examId_fkey";

-- AddForeignKey
ALTER TABLE "exam_sets" ADD CONSTRAINT "exam_sets_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
