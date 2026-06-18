import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "uploads", "recipients");
    await fs.mkdir(uploadDir, { recursive: true });

    // Sanitize name to prevent path traversal
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    const filepath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filepath, buffer);

    // Parse Excel/CSV
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty" },
        { status: 400 },
      );
    }

    // Get columns
    const columns = Object.keys(rawData[0] as object);
    const requiredColumns = ["email", "company_name", "recruiter_name", "role"];
    const missing = requiredColumns.filter((c) => !columns.includes(c));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missing.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const preview = rawData.slice(0, 3);

    return NextResponse.json({
      success: true,
      filename: uniqueName,
      rows: rawData.length,
      columns,
      preview,
    });
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    console.error("Recipients upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 },
    );
  }
}
