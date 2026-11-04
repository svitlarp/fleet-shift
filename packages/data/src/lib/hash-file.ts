import { createHash } from "node:crypto";
import  { createReadStream } from "node:fs";


/**
 * Calculates the SHA-256 hash of a file by reading its contents as a stream.
 * @param filePath - Absolute path to the XML file
 * @returns A promise that resolves to the hash as a hexadecimal string
 */
export async function calculateFileHash(filePath: string): Promise<string> {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);  

    for  await (const chunk of stream) {
      hash.update(chunk as Buffer);
    }
    return hash.digest("hex");
  };