import Anthropic from "@anthropic-ai/sdk";
import type { ExtractClient } from "./extract";

const TIMEOUT_MS = 30_000;
const DEFAULT_MODEL = "claude-sonnet-5-5";

/** The only place the real Claude API is called. Tests replace this module. */
export function createExtractClient(): ExtractClient {
  const anthropic = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 0 });
  const model = process.env.CLAUDE_MODEL || DEFAULT_MODEL;
  return {
    async readImage({ image, mediaType, prompt }) {
      const message = await anthropic.messages.create({
        model,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: image.toString("base64") } },
              { type: "text", text: prompt },
            ],
          },
        ],
      });
      return message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
    },
  };
}
