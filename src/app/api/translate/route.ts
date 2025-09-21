import { NextResponse } from "next/server";
import translate from "translate";

export async function POST(req: Request) {
	try {
		const { text, target } = await req.json();

		if (!text || !target) {
			return NextResponse.json(
				{ error: "Missing required parameters" },
				{ status: 400 },
			);
		}

		const translatedText = await translate(text, { to: target });

		return NextResponse.json({ translatedText });
	} catch (error) {
		console.error("Translation error:", error);
		return NextResponse.json(
			{ error: "Failed to translate" },
			{ status: 500 },
		);
	}
}