import { expect, test } from "@playwright/test";

const CARD = "CARD-E2E-01";
const REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4";

test.describe.configure({ mode: "serial" });

test("health endpoint melaporkan DB up", async ({ request }) => {
  const resp = await request.get("/api/health");
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.ok).toBe(true);
});

test("kartu tidak dikenal → halaman Kartu Tidak Valid + noindex", async ({
  page,
}) => {
  const resp = await page.goto("/c/CARD-TIDAK-ADA");
  await expect(page.getByText("Kartu Tidak Valid")).toBeVisible();
  expect(resp?.headers()["x-robots-tag"] ?? "").toContain("noindex");
});

test("scan pertama → form aktivasi → sukses", async ({ page }) => {
  await page.goto(`/c/${CARD}`);
  await expect(page.getByRole("heading", { name: "Aktivasi Kartu" })).toBeVisible();

  await page.getByLabel("Nama Bisnis").fill("Warung E2E");
  await page.getByLabel("Link Google Review").fill(REVIEW_URL);
  await page.getByLabel("PIN 4 Digit").fill("1234");
  await page.getByRole("button", { name: "Aktivasi Kartu" }).click();

  await expect(page.getByText("Kartu Berhasil Diaktivasi")).toBeVisible();
  await expect(page.getByRole("link", { name: "Buka Google Review" })).toBeVisible();
});

test("scan kedua → redirect 307 ke Google Review", async ({ request }) => {
  const resp = await request.get(`/c/${CARD}`, { maxRedirects: 0 });
  expect(resp.status()).toBe(307);
  expect(resp.headers()["location"] ?? "").toContain(
    "search.google.com/local/writereview"
  );
});

test("edit: PIN salah ditolak", async ({ page }) => {
  await page.goto(`/c/${CARD}/edit`);
  await expect(page.getByRole("heading", { name: "Edit Data Kartu" })).toBeVisible();

  await page.getByLabel("PIN").fill("9999");
  await page.getByRole("button", { name: "Buka Pengaturan" }).click();

  await expect(page.getByText("PIN salah")).toBeVisible();
});

test("edit: PIN benar → form → simpan perubahan", async ({ page }) => {
  await page.goto(`/c/${CARD}/edit`);
  await page.getByLabel("PIN").fill("1234");
  await page.getByRole("button", { name: "Buka Pengaturan" }).click();

  await expect(
    page.getByRole("heading", { name: "Pengaturan Kartu" })
  ).toBeVisible();

  await page.getByLabel("Nama Bisnis").fill("Warung E2E Updated");
  await page.getByRole("button", { name: "Simpan Perubahan" }).click();

  await expect(page.getByText("Data kartu berhasil diperbarui")).toBeVisible();
});

test("admin: belum login → form Login Admin + noindex", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Login Admin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/
  );
});

test("admin: password salah ditolak", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("salah-salah");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Username atau password salah")).toBeVisible();
});

test("admin: login admin/admin123 → dashboard tampil", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(
    page.getByRole("heading", { name: "ReviewKU QR · Admin" })
  ).toBeVisible();
  await expect(page.getByText("Total Kartu")).toBeVisible();
  await expect(page.getByText("Masuk sebagai admin")).toBeVisible();
});

test("edit: 5x PIN salah → kartu terkunci 60 detik", async ({ page }) => {
  const card = "CARD-E2E-02";

  await page.goto(`/c/${card}`);
  await expect(page.getByRole("heading", { name: "Aktivasi Kartu" })).toBeVisible();
  await page.getByLabel("Nama Bisnis").fill("Warung Lockout");
  await page.getByLabel("Link Google Review").fill(REVIEW_URL);
  await page.getByLabel("PIN 4 Digit").fill("5678");
  await page.getByRole("button", { name: "Aktivasi Kartu" }).click();
  await expect(page.getByText("Kartu Berhasil Diaktivasi")).toBeVisible();

  await page.goto(`/c/${card}/edit`);
  await expect(page.getByRole("heading", { name: "Edit Data Kartu" })).toBeVisible();

  const submitWrongPin = async () => {
    await page.getByLabel("PIN").fill("1111");
    await Promise.all([
      page.waitForResponse(
        (r) => r.request().method() === "POST" && r.url().includes(`/c/${card}/edit`)
      ),
      page.getByRole("button", { name: "Buka Pengaturan" }).click(),
    ]);
  };

  for (let i = 0; i < 4; i++) {
    await submitWrongPin();
    await expect(page.getByText("PIN salah.")).toBeVisible();
  }

  await submitWrongPin();
  await expect(page.getByText(/terkunci \d+ detik/)).toBeVisible();
});
