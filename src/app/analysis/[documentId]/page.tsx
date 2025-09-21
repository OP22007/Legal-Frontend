import { prisma } from "@/lib/db";
import { AnalysisClient, type DocumentWithAnalysis } from "./client";
import { TranslatedText } from "@/components/TranslatedText";

// This is the main page component.
export default async function AnalysisPage({
  params,
}: {
  params: { documentId: string };
}) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.documentId },
      include: {
        analyses: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        riskFactors: {
          orderBy: {
            // Order by severity: CRITICAL, HIGH, MEDIUM, LOW
            severity: 'desc',
          },
        },
        keyPoints: {
          orderBy: {
            importance: 'desc',
          },
        },
        glossaryTerms: true,
      },
    });

    if (!document) {
      return <div className="flex items-center justify-center h-screen text-xl"><TranslatedText text='Document not found.'/></div>;
    }

    // The cast is needed because Prisma's return type for includes is not automatically
    // applied to the base Document type in a way TypeScript can infer without help.
    return <AnalysisClient document={document as DocumentWithAnalysis} />;
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return <div className="flex items-center justify-center h-screen text-xl text-red-500"><TranslatedText text='Error loading analysis. Please try again later.'/></div>;
  }
}
