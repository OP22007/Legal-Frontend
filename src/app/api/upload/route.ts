//src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
	const data = await req.formData();
	const file: File | null = data.get("file") as unknown as File;

	if (!file) {
		return NextResponse.json({ success: false, error: "No file provided" });
	}

	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);

	// Create a temporary directory for uploads
	const path = join(process.cwd(), "temp_files", file.name);

	try {
		await writeFile(path, buffer);
		console.log(`File saved to ${path}`);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving file:", error);
		return NextResponse.json({
			success: false,
			error: "Failed to save file",
		});
	}
}