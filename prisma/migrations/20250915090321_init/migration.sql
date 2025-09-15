-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."UserPersona" AS ENUM ('STUDENT', 'FREELANCER', 'TENANT', 'SMALL_BUSINESS', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('RENTAL_AGREEMENT', 'LOAN_CONTRACT', 'TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'EMPLOYMENT_CONTRACT', 'FREELANCE_CONTRACT', 'PURCHASE_AGREEMENT', 'NDA', 'PARTNERSHIP_AGREEMENT', 'INSURANCE_POLICY', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'ANALYZED', 'ERROR', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AnalysisType" AS ENUM ('FULL_ANALYSIS', 'RISK_ASSESSMENT', 'KEY_POINTS', 'SUMMARY', 'CLAUSE_ANALYSIS');

-- CreateEnum
CREATE TYPE "public"."RiskCategory" AS ENUM ('FINANCIAL', 'LEGAL', 'PRIVACY', 'TERMINATION', 'OBLIGATION', 'DISPUTE_RESOLUTION', 'RENEWAL', 'PENALTY');

-- CreateEnum
CREATE TYPE "public"."KeyPointCategory" AS ENUM ('PAYMENT_TERMS', 'TERMINATION_CLAUSES', 'LIABILITY', 'WARRANTIES', 'INTELLECTUAL_PROPERTY', 'CONFIDENTIALITY', 'DISPUTE_RESOLUTION', 'GOVERNING_LAW', 'FORCE_MAJEURE', 'AMENDMENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."ExportFormat" AS ENUM ('PDF', 'DOCX', 'HTML', 'JSON');

-- CreateEnum
CREATE TYPE "public"."ShareStatus" AS ENUM ('PRIVATE', 'SHARED_LINK', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'DOCUMENT_UPLOADED', 'DOCUMENT_ANALYZED', 'DOCUMENT_TRANSLATED', 'DOCUMENT_EXPORTED', 'CHAT_SESSION_STARTED', 'RISK_DETECTED', 'ERROR_OCCURRED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "persona" "public"."UserPersona" NOT NULL DEFAULT 'GENERAL',
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dataRetentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL DEFAULT 'OTHER',
    "detectedLanguage" TEXT NOT NULL DEFAULT 'en',
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "extractedText" TEXT,
    "textExtractionMethod" TEXT,
    "pageCount" INTEGER,
    "wordCount" INTEGER,
    "overallRiskScore" DOUBLE PRECISION DEFAULT 0,
    "riskLevel" "public"."RiskLevel" DEFAULT 'LOW',
    "processingTimeMs" INTEGER,
    "aiModelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "analyzedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_analyses" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "analysisType" "public"."AnalysisType" NOT NULL,
    "summary" JSONB,
    "detailedAnalysis" JSONB,
    "recommendations" JSONB,
    "potentialIssues" JSONB,
    "promptTemplate" TEXT,
    "aiResponse" JSONB,
    "processingTimeMs" INTEGER,
    "tokensUsed" INTEGER,
    "aiModelUsed" TEXT,
    "confidenceScore" DOUBLE PRECISION DEFAULT 0,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."risk_factors" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" "public"."RiskCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."RiskLevel" NOT NULL,
    "likelihood" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pageNumber" INTEGER,
    "paragraphNumber" INTEGER,
    "textSnippet" TEXT,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "mitigation" TEXT,
    "isActionable" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_translations" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "translatedSummary" JSONB,
    "preservedTerms" JSONB,
    "translationService" TEXT NOT NULL DEFAULT 'google-translate',
    "qualityScore" DOUBLE PRECISION DEFAULT 0,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "processingTimeMs" INTEGER,
    "characterCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."key_points" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" "public"."KeyPointCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "pageNumber" INTEGER,
    "sectionTitle" TEXT,
    "paragraphNumber" INTEGER,
    "textSnippet" TEXT NOT NULL,
    "startOffset" INTEGER,
    "endOffset" INTEGER,
    "explanation" TEXT,
    "potentialImpact" TEXT,
    "userFriendlyTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."glossary_terms" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "simplifiedDefinition" TEXT,
    "category" TEXT,
    "contextSentence" TEXT,
    "relatedTerms" JSONB,
    "isLegalJargon" BOOLEAN NOT NULL DEFAULT true,
    "frequency" INTEGER NOT NULL DEFAULT 1,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "public"."MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "tokensUsed" INTEGER,
    "processingTimeMs" INTEGER,
    "modelUsed" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."export_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "format" "public"."ExportFormat" NOT NULL,
    "exportType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "exportUrl" TEXT,
    "exportData" JSONB,
    "shareStatus" "public"."ShareStatus" NOT NULL DEFAULT 'PRIVATE',
    "shareToken" TEXT,
    "shareExpiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentsUploaded" INTEGER NOT NULL DEFAULT 0,
    "analysesGenerated" INTEGER NOT NULL DEFAULT 0,
    "chatMessagesExchanged" INTEGER NOT NULL DEFAULT 0,
    "translationsRequested" INTEGER NOT NULL DEFAULT 0,
    "exportsGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "averageSessionTime" INTEGER NOT NULL DEFAULT 0,
    "mostUsedPersona" "public"."UserPersona",
    "mostAnalyzedDocType" "public"."DocumentType",
    "preferredLanguages" JSONB,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."ActionType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "public"."users"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_passwordResetToken_key" ON "public"."users"("passwordResetToken");

-- CreateIndex
CREATE UNIQUE INDEX "documents_fileHash_key" ON "public"."documents"("fileHash");

-- CreateIndex
CREATE INDEX "documents_userId_createdAt_idx" ON "public"."documents"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "public"."documents"("status");

-- CreateIndex
CREATE INDEX "documents_documentType_idx" ON "public"."documents"("documentType");

-- CreateIndex
CREATE INDEX "documents_expiresAt_idx" ON "public"."documents"("expiresAt");

-- CreateIndex
CREATE INDEX "document_analyses_documentId_analysisType_idx" ON "public"."document_analyses"("documentId", "analysisType");

-- CreateIndex
CREATE INDEX "document_analyses_createdAt_idx" ON "public"."document_analyses"("createdAt");

-- CreateIndex
CREATE INDEX "risk_factors_documentId_severity_idx" ON "public"."risk_factors"("documentId", "severity");

-- CreateIndex
CREATE INDEX "risk_factors_category_idx" ON "public"."risk_factors"("category");

-- CreateIndex
CREATE INDEX "document_translations_targetLanguage_idx" ON "public"."document_translations"("targetLanguage");

-- CreateIndex
CREATE UNIQUE INDEX "document_translations_documentId_targetLanguage_key" ON "public"."document_translations"("documentId", "targetLanguage");

-- CreateIndex
CREATE INDEX "key_points_documentId_category_idx" ON "public"."key_points"("documentId", "category");

-- CreateIndex
CREATE INDEX "key_points_importance_idx" ON "public"."key_points"("importance");

-- CreateIndex
CREATE INDEX "glossary_terms_term_idx" ON "public"."glossary_terms"("term");

-- CreateIndex
CREATE INDEX "glossary_terms_documentId_idx" ON "public"."glossary_terms"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "glossary_terms_term_language_documentId_key" ON "public"."glossary_terms"("term", "language", "documentId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_lastMessageAt_idx" ON "public"."chat_sessions"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_sessions_documentId_idx" ON "public"."chat_sessions"("documentId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "public"."chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "export_history_shareToken_key" ON "public"."export_history"("shareToken");

-- CreateIndex
CREATE INDEX "export_history_userId_createdAt_idx" ON "public"."export_history"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "export_history_shareToken_idx" ON "public"."export_history"("shareToken");

-- CreateIndex
CREATE INDEX "user_analytics_date_idx" ON "public"."user_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "user_analytics_userId_date_key" ON "public"."user_analytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "public"."system_config"("key");

-- CreateIndex
CREATE INDEX "system_config_category_idx" ON "public"."system_config"("category");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "public"."audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "public"."audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "public"."audit_logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_analyses" ADD CONSTRAINT "document_analyses_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."risk_factors" ADD CONSTRAINT "risk_factors_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_translations" ADD CONSTRAINT "document_translations_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."key_points" ADD CONSTRAINT "key_points_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."glossary_terms" ADD CONSTRAINT "glossary_terms_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_sessions" ADD CONSTRAINT "chat_sessions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."export_history" ADD CONSTRAINT "export_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."export_history" ADD CONSTRAINT "export_history_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_analytics" ADD CONSTRAINT "user_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
