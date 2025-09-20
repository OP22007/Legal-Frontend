import { NextResponse } from "next/server";
import { RiskLevel } from "../../../../generated/prisma/client";
import { prisma } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
const calculateRisk = (risks: { severity: string }[]) => {
	if (!risks || risks.length === 0) {
		return { overallRiskScore: 0, riskLevel: RiskLevel.LOW };
	}
	const scoreMap: { [key: string]: number } = {
		LOW: 1,
		MEDIUM: 3,
		HIGH: 5,
		CRITICAL: 10,
	};
	const totalScore = risks.reduce((acc, risk) => {
		return acc + (scoreMap[risk.severity.toUpperCase()] || 0);
	}, 0);
	const averageScore = totalScore / risks.length;
	let riskLevel: RiskLevel = RiskLevel.LOW;
	if (averageScore >= 5) {
		riskLevel = RiskLevel.CRITICAL;
	} else if (averageScore >= 3) {
		riskLevel = RiskLevel.HIGH;
	} else if (averageScore >= 2) {
		riskLevel = RiskLevel.MEDIUM;
	}
	return { overallRiskScore: averageScore, riskLevel };
};
export async function POST(req: Request) {
	try {
		// Check for Authorization header and validate token
		const session = await getServerSession(authOptions);
		if (!session || !session.user || !session.user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const userId = session.user.id;
		const body = await req.json();
		const {
			analysisResult,
			fileMetadata
		} = body;
		if (!analysisResult || !fileMetadata) {
			return NextResponse.json({
				error: "Missing analysis results or file metadata"
			}, {
				status: 400
			});
		}
		const {
			document_id,
            file_url,
			summary,
			risk_alerts,
			glossary,
			key_points
		} = analysisResult;
		const {
			fileName,
			fileSize,
			fileType
		} = fileMetadata;
		const {
			overallRiskScore,
			riskLevel
		} = calculateRisk(risk_alerts);
		const newDocument = await prisma.document.create({
			data: {
				id: document_id,
				userId: userId,
				originalFileName: fileName,
				fileSize: fileSize,
				mimeType: fileType,
				status: "ANALYZED",
				// This should be a real hash in production
				fileHash: `placeholder-hash-${document_id}`,
				storageUrl: file_url,
				overallRiskScore,
				riskLevel,
				analyzedAt: new Date(),
				analyses: {
					create: [{
						analysisType: "FULL_ANALYSIS",
						summary: {
							main: summary
						},
					}, ],
				},
				riskFactors: {
					create: risk_alerts.map((alert: {
						severity: string;description: string
					}) => ({
						title: alert.description.slice(0, 50),
						description: alert.description,
						severity: alert.severity.toUpperCase() as RiskLevel,
						category: "LEGAL", // Default category
					})),
				},
				glossaryTerms: {
					create: glossary.map((term: {
						term: string;definition: string
					}) => ({
						term: term.term,
						definition: term.definition,
						simplifiedDefinition: term.definition,
					})),
				},
				keyPoints: {
					create: key_points.map((point: string, index: number) => {
						// Try to categorize the key point based on content
						let category: string = 'OTHER';
						const pointLower = point.toLowerCase();
						
						if (pointLower.includes('payment') || pointLower.includes('financial') || pointLower.includes('money')) {
							category = 'PAYMENT_TERMS';
						} else if (pointLower.includes('termination') || pointLower.includes('end') || pointLower.includes('cancel')) {
							category = 'TERMINATION_CLAUSES';
						} else if (pointLower.includes('liability') || pointLower.includes('responsibility')) {
							category = 'LIABILITY';
						} else if (pointLower.includes('warranty') || pointLower.includes('guarantee')) {
							category = 'WARRANTIES';
						} else if (pointLower.includes('intellectual property') || pointLower.includes('copyright') || pointLower.includes('patent')) {
							category = 'INTELLECTUAL_PROPERTY';
						} else if (pointLower.includes('confidential') || pointLower.includes('privacy') || pointLower.includes('nda')) {
							category = 'CONFIDENTIALITY';
						} else if (pointLower.includes('dispute') || pointLower.includes('arbitration') || pointLower.includes('court')) {
							category = 'DISPUTE_RESOLUTION';
						} else if (pointLower.includes('governing law') || pointLower.includes('jurisdiction')) {
							category = 'GOVERNING_LAW';
						} else if (pointLower.includes('force majeure') || pointLower.includes('act of god')) {
							category = 'FORCE_MAJEURE';
						} else if (pointLower.includes('amendment') || pointLower.includes('modification')) {
							category = 'AMENDMENTS';
						}

						return {
							category: category as any,
							title: point.length > 100 ? point.substring(0, 97) + '...' : point,
							description: point,
							importance: Math.max(1, Math.min(5, 6 - index)), // Higher importance for earlier points
							textSnippet: point,
							userFriendlyTitle: point.length > 50 ? point.substring(0, 47) + '...' : point,
						};
					}),
				},
			},
		});
		return NextResponse.json({
			message: "Document analyzed and saved successfully",
			document: newDocument,
		}, {
			status: 201
		});
	} catch (error) {
		console.error("Error saving document:", error);
		return NextResponse.json({
			error: "Failed to save document analysis."
		}, {
			status: 500
		});
	}
}