import { describe, expect, it } from "vitest";
import { APP_NAME } from "@/lib/app-name";

describe("scaffold", () => {
  it("exposes the app name", () => {
    expect(APP_NAME).toBe("Billing record");
  });
});
