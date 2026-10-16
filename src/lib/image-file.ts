/** Same limits and messages as /api/extract, so the upload box can reject a bad file before sending it. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function checkImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Only JPEG, PNG or WebP images are accepted";
  if (file.size > MAX_IMAGE_BYTES) return "Image is larger than 10 MB";
  return null;
}
