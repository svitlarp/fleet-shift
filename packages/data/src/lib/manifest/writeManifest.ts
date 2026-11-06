import fs from "node:fs/promises";
import type { BaseManifest } from "../../types/manifest.ts";

/**
 * Write manifest to the manifest file
 * @param filePath Write manifest to the manifest file
 * @param content
 */
export async function writeManifest(
  filePath: string,
  content: BaseManifest[],
): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(filePath, { recursive: true });
  }

  await fs.writeFile(filePath, JSON.stringify(content, null, 2), "utf-8");
}
