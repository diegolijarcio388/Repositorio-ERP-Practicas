import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";
import { withApiError } from "../../../core/server/api-handler";
import { jsonOk } from "../../../core/server/api-response";
import { requireApiUser } from "../../../modules/rbac/services/api-auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "permissions");

const ALLOWED_FILE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const sanitizeFileName = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const POST: APIRoute = withApiError(async (context) => {
  const user = await requireApiUser(context);
  const formData = await context.request.formData();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    throw new Error("Debes adjuntar al menos una foto o archivo.");
  }

  if (files.length > MAX_FILES) {
    throw new Error(`Puedes adjuntar un maximo de ${MAX_FILES} archivos.`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const storedFiles: Array<{ attachmentUrl: string; fileName: string }> = [];

  for (const file of files) {
    if (file.size <= 0) {
      throw new Error(`El archivo ${file.name} esta vacio.`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`El archivo ${file.name} supera los 5 MB.`);
    }

    const extension = ALLOWED_FILE_TYPES[file.type];
    if (!extension) {
      throw new Error("Solo se permiten imagenes JPG, PNG, WEBP o PDF.");
    }

    const safeBaseName =
      sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "justificante";
    const storedName = `${user.userId}-${Date.now()}-${randomUUID()}-${safeBaseName}.${extension}`;
    const storedPath = path.join(UPLOAD_DIR, storedName);

    await writeFile(storedPath, Buffer.from(await file.arrayBuffer()));

    storedFiles.push({
      attachmentUrl: `/uploads/permissions/${storedName}`,
      fileName: file.name,
    });
  }

  return jsonOk({
    attachmentUrls: storedFiles.map((file) => file.attachmentUrl),
    files: storedFiles,
  });
});
