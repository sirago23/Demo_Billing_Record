import { describe, expect, it } from "vitest";
import { checkImageFile } from "@/lib/image-file";

describe("checkImageFile", () => {
  it("accepts JPEG, PNG and WebP up to 10 MB", () => {
    expect(checkImageFile({ type: "image/jpeg", size: 1000 })).toBeNull();
    expect(checkImageFile({ type: "image/png", size: 10 * 1024 * 1024 })).toBeNull();
    expect(checkImageFile({ type: "image/webp", size: 1 })).toBeNull();
  });

  it("rejects other file types with the same message the server uses", () => {
    expect(checkImageFile({ type: "application/pdf", size: 1000 })).toBe(
      "Only JPEG, PNG or WebP images are accepted",
    );
  });

  it("rejects files over 10 MB", () => {
    expect(checkImageFile({ type: "image/png", size: 10 * 1024 * 1024 + 1 })).toBe("Image is larger than 10 MB");
  });
});
