import { expect, test } from "@playwright/test";
import { E2E_PASSWORD } from "../playwright.config";

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

test("delete asks first: Cancel and Esc keep the row, confirming removes it", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  const created = await page.request.post("/api/records", {
    data: {
      type: "expense",
      amount: 99.5,
      date: todayLocal(),
      category: "Shopping",
      merchant: "E2E Delete Shop",
      note: "",
    },
  });
  expect(created.status()).toBe(201);

  await page.goto("/records");
  await page.waitForLoadState("networkidle");
  const row = page.getByRole("row", { name: /E2E Delete Shop/ });
  const dialog = page.getByRole("dialog", { name: "Delete this record?" });
  await expect(row).toBeVisible();

  // Cancel keeps the row.
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("฿99.50");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(row).toBeVisible();

  // Esc keeps the row.
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(row).toBeVisible();

  // Confirm removes it.
  await row.getByRole("button", { name: "Delete" }).click();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog).toBeHidden();
  await expect(row).toHaveCount(0);
});
