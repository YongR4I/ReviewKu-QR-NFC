import { expect, test } from "@playwright/test";
import { localEnv } from "../helpers";

const CARD = "CARD-E2E-01";
const REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4";
const ADMIN_USER = localEnv().ADMIN_USERNAME ?? "admin";
const ADMIN_PASS = localEnv().ADMIN_PASSWORD ?? "";

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

const CONVERTED_URL = `${REVIEW_URL.split("?")[0]}?placeid=ChIJ7cU2YabFaS4R2Xkxnko24EI`;

test("aktivasi dengan link Maps → otomatis jadi link tulis ulasan", async ({
  page,
  request,
}) => {
  const mapsUrl =
    "https://www.google.com/maps/place/Anami+Coffee/@1.23,4.56,17z/data=!4m8!3m7!1s0x2e69c5a66136c5ed:0x42e0364a9e3179d9!8m2!3d1.23!4d4.56";

  await page.goto("/c/CARD-E2E-03");
  await expect(page.getByRole("heading", { name: "Aktivasi Kartu" })).toBeVisible();

  await page.getByLabel("Nama Bisnis").fill("Kopi Konversi");
  await page.getByLabel("Link Google Review").fill(mapsUrl);
  await page.getByLabel("PIN 4 Digit").fill("4321");
  await page.getByRole("button", { name: "Aktivasi Kartu" }).click();

  await expect(page.getByText("Kartu Berhasil Diaktivasi")).toBeVisible();
  await expect(page.getByText(CONVERTED_URL)).toBeVisible();

  const resp = await request.get("/c/CARD-E2E-03", { maxRedirects: 0 });
  expect(resp.status()).toBe(307);
  expect(resp.headers()["location"] ?? "").toBe(CONVERTED_URL);
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
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password").fill("salah-salah");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByText("Username atau password salah")).toBeVisible();
});

test("admin: login → dashboard tampil", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password").fill(ADMIN_PASS);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(
    page.getByRole("heading", { name: "ReviewKU QR · Admin" })
  ).toBeVisible();
  await expect(page.getByText("Masuk sebagai admin")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Daftar Kartu" })).toBeVisible();
  await expect(page.getByText("CARD-E2E-01")).toBeVisible();
});

test("admin: hapus kartu permanen dari daftar", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password").fill(ADMIN_PASS);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page.getByRole("heading", { name: "Daftar Kartu" })).toBeVisible();

  await page.on("dialog", (d) => d.accept());
  for (const card of ["CARD-E2E-01", "CARD-E2E-03"]) {
    await page
      .getByRole("row", { name: new RegExp(card) })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByText("dihapus permanen")).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(card) })).toHaveCount(0);
  }
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
