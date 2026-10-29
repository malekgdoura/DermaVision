-- CreateEnum
CREATE TYPE "ReportStyle" AS ENUM ('SHORT', 'DETAILED', 'PATIENT_FRIENDLY');

-- CreateEnum
CREATE TYPE "ReportVersionKind" AS ENUM ('AI_DRAFT', 'DOCTOR_EDIT', 'PUBLISHED');

-- AlterEnum
ALTER TYPE "AnalysisStatus" ADD VALUE 'IN_REVIEW';

-- AlterTable
ALTER TABLE "SkinAnalysis" ADD COLUMN     "reviewerId" TEXT;

-- CreateTable
CREATE TABLE "MedicalReview" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "correctedResult" JSONB NOT NULL,
    "clinicalNotes" TEXT,
    "indicatorsValidatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportVersion" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "kind" "ReportVersionKind" NOT NULL,
    "style" "ReportStyle" NOT NULL,
    "language" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalReview_analysisId_key" ON "MedicalReview"("analysisId");

-- CreateIndex
CREATE INDEX "ReportVersion_authorId_idx" ON "ReportVersion"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportVersion_reviewId_number_key" ON "ReportVersion"("reviewId", "number");

-- CreateIndex
CREATE INDEX "SkinAnalysis_status_createdAt_idx" ON "SkinAnalysis"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SkinAnalysis_reviewerId_idx" ON "SkinAnalysis"("reviewerId");

-- AddForeignKey
ALTER TABLE "SkinAnalysis" ADD CONSTRAINT "SkinAnalysis_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalReview" ADD CONSTRAINT "MedicalReview_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SkinAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "MedicalReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

