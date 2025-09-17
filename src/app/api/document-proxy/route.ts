import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");

  if (!fileUrl) {
    return new NextResponse("URL parameter is missing", { status: 400 });
  }

  try {
    // Regular expression to extract the file ID from a Google Drive link
    const driveRegex = /drive\.google\.com\/(?:file\/d\/|uc\?id=)([\w-]+)/;
    const match = fileUrl.match(driveRegex);

    let downloadUrl = fileUrl;

    // If it's a Google Drive link, transform it into a direct download link
    if (match && match[1]) {
      const fileId = match[1];
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    const response = await fetch(downloadUrl, {
      headers: {
        // It's good practice to forward some headers, but be careful not to leak info.
        // For now, we send a generic user-agent.
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch file: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Stream the file content back to the client
    const readableStream = response.body;
    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/pdf",
        "Content-Disposition": response.headers.get("Content-Disposition") || `inline; filename="document.pdf"`,
      },
    });

  } catch (error) {
    console.error("[DOCUMENT_PROXY_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
