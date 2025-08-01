-- DropForeignKey
ALTER TABLE "ExamSubmission" DROP CONSTRAINT "ExamSubmission_examId_fkey";

-- DropForeignKey
ALTER TABLE "cq_sheets" DROP CONSTRAINT "cq_sheets_examId_fkey";

-- DropForeignKey
ALTER TABLE "exam_student_maps" DROP CONSTRAINT "exam_student_maps_examId_fkey";

-- DropForeignKey
ALTER TABLE "omr_sheets" DROP CONSTRAINT "omr_sheets_examId_fkey";

-- DropForeignKey
ALTER TABLE "results" DROP CONSTRAINT "results_examId_fkey";

-- AddForeignKey
ALTER TABLE "exam_student_maps" ADD CONSTRAINT "exam_student_maps_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "omr_sheets" ADD CONSTRAINT "omr_sheets_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cq_sheets" ADD CONSTRAINT "cq_sheets_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubmission" ADD CONSTRAINT "ExamSubmission_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
