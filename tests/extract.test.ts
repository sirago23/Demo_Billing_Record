import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { extractFromImage, UNREADABLE_MESSAGE, type ExtractClient } from "@/lib/extract";

const validAnswer = JSON.stringify({
  type: "expense",
  amount: 500,
  date: "2569-10-15",
  category: "Other",
  merchant_or_counterparty: "นาย จิรัฐ",
  confidence: 0.92,
});

async function bigImage() {
  return sharp({ create: { width: 3000, height: 1200, channels: 3, background: "#fff" } })
    .png()
    .toBuffer();
}

function fakeClient(reply: () => Promise<string>, seen?: { image?: Buffer; mediaType?: string }): ExtractClient {
  return {
    async readImage({ image, mediaType }) {
      if (seen) {
        seen.image = image;
        seen.mediaType = mediaType;
      }
      return reply();
    },
  };
}

describe("extractFromImage", () => {
  it("returns parsed data and converts the Buddhist-era year", async () => {
    const result = await extractFromImage(await bigImage(), fakeClient(async () => validAnswer));
    expect(result).toMatchObject({ ok: true, data: { amount: 500, date: "2026-10-15", confidence: 0.92 } });
  });

  it("accepts JSON wrapped in extra text", async () => {
    const result = await extractFromImage(
      await bigImage(),
      fakeClient(async () => `Here you go:\n${validAnswer}\nDone.`),
    );
    expect(result.ok).toBe(true);
  });

  it("sends the model a JPEG with the long edge at most 1568 px", async () => {
    const seen: { image?: Buffer; mediaType?: string } = {};
    await extractFromImage(await bigImage(), fakeClient(async () => validAnswer, seen));
    const meta = await sharp(seen.image).metadata();
    expect(seen.mediaType).toBe("image/jpeg");
    expect(meta.format).toBe("jpeg");
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBeLessThanOrEqual(1568);
  });

  it("returns the fill-in-manually result when the answer is garbage", async () => {
    const result = await extractFromImage(await bigImage(), fakeClient(async () => "I cannot read this"));
    expect(result).toEqual({ ok: false, message: UNREADABLE_MESSAGE });
  });

  it("returns the fill-in-manually result when the answer has an unknown category", async () => {
    const bad = validAnswer.replace('"Other"', '"Groceries"');
    const result = await extractFromImage(await bigImage(), fakeClient(async () => bad));
    expect(result).toEqual({ ok: false, message: UNREADABLE_MESSAGE });
  });

  it("returns the fill-in-manually result when the client throws", async () => {
    const result = await extractFromImage(
      await bigImage(),
      fakeClient(async () => {
        throw new Error("timeout");
      }),
    );
    expect(result).toEqual({ ok: false, message: UNREADABLE_MESSAGE });
  });

  it("returns the fill-in-manually result when the bytes are not an image", async () => {
    const result = await extractFromImage(Buffer.from("not an image"), fakeClient(async () => validAnswer));
    expect(result).toEqual({ ok: false, message: UNREADABLE_MESSAGE });
  });
});
