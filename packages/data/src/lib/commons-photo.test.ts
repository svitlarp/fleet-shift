import { describe, expect, it } from "vitest";
import { isAllowedLicense, isJpeg, plainAuthor } from "./commons-photo.ts";

describe("commons photo helpers", () => {
  it("accepts only open licenses", () => {
    for (const license of [
      "CC0",
      "Public domain",
      "CC BY 2.0",
      "CC BY-SA 4.0",
    ]) {
      expect(isAllowedLicense(license)).toBe(true);
    }
    for (const license of ["CC BY-NC 4.0", "CC BY-ND 4.0", "Fair use", ""]) {
      expect(isAllowedLicense(license)).toBe(false);
    }
  });

  it("extracts a plain author name", () => {
    expect(plainAuthor('<a href="//x">Jane &amp; Co</a>\n')).toBe("Jane & Co");
    expect(plainAuthor(undefined)).toBe("Unknown author");
  });

  it("detects JPEG bytes", () => {
    expect(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(isJpeg(new TextEncoder().encode("<html>"))).toBe(false);
  });
});
