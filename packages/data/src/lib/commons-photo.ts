const ALLOWED_LICENSE = /^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+)/i;

export const isAllowedLicense = (license: string): boolean =>
  ALLOWED_LICENSE.test(license.trim());

const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");

/** Commons returns the author as HTML; the credit needs plain text. */
export function plainAuthor(html: string | undefined): string {
  const text = decodeEntities((html ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  return text || "Unknown author";
}

export const isJpeg = (bytes: Uint8Array): boolean =>
  bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
