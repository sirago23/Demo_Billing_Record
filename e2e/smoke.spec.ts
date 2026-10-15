import { expect, test } from "@playwright/test";
import { E2E_PASSWORD } from "../playwright.config";

test("log in, add a manual expense, see it in the list and on the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Wrong password")).toBeVisible();

  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  await page.getByRole("link", { name: "Add record" }).click();
  // Inputs filled before React hydrates get reset, so let the page settle first.
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Amount (THB)").fill("125.50");
  await page.getByLabel("Category").selectOption("Entertainment");
  await page.getByLabel("Merchant / counterparty").fill("E2E Cinema");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Record saved")).toBeVisible();

  await page.goto("/records");
  const row = page.getByRole("row", { name: /E2E Cinema/ });
  await expect(row).toContainText("฿125.50");
  await expect(row).toContainText("Entertainment");

  await page.goto("/");
  const legendRow = page.getByText("Entertainment").first();
  await expect(legendRow).toBeVisible();
  await expect(page.getByText("฿125.50").first()).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
