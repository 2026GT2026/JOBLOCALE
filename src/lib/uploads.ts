import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"]);

export async function saveUpload(file: File): Promise<{ filename: string; storedPath: string }> {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, PNG, JPG.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  const storedName = `${crypto.randomUUID()}${ext}`;
  const storedPath = path.join(UPLOAD_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(storedPath, buffer);

  return { filename: file.name, storedPath: storedName };
}

export function resolveUploadPath(storedName: string): string {
  return path.join(UPLOAD_DIR, storedName);
}
