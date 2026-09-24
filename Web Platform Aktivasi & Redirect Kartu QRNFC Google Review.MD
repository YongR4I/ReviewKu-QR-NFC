# PRODUCT REQUIREMENT DOCUMENT (PRD) - UPDATED

**PRD: Web Platform Aktivasi & Redirect Kartu QR/NFC Google Review**

**Status: Draft / Updated Version**  
**Target Release: Q4 2026**  
**Tech Stack: Next.js (App Router), Vercel (Hosting), Supabase (PostgreSQL Database), Tailwind CSS**

## 1. Executive Summary & Objective
Tujuan dari project ini adalah membuat platform web serverless yang memfasilitasi aktivasi dinamis dan redirection dari kartu fisik berbasis QR Code/NFC. Platform ini memungkinkan pemilik bisnis/UMKM untuk membeli "kartu kosong" (blank card), melakukan aktivasi mandiri saat scan/tap pertama kali, dan mengarahkan pengguna secara langsung ke halaman ulasan/review Google Maps bisnis mereka secara instan.
## 2. Core User Stories

**Sebagai Pembeli Kartu (Owner Bisnis/UMKM):**

- Saya ingin memindai (scan/tap) kartu yang baru saya beli untuk mendaftarkan nama bisnis dan link Google Review saya tanpa memerlukan aplikasi tambahan.
- Saya ingin membuat PIN 4-digit keamanan agar info bisnis saya pada kartu tersebut tidak diubah oleh pihak yang tidak bertanggung jawab.
- Saya ingin bisa mengedit kembali link ulasan atau nama bisnis saya kapan saja jika terjadi perubahan.

**Sebagai Pelanggan / End-User:**

- Saya ingin saat melakukan scan/tap pada kartu fisik, browser saya langsung terarah ke pop-up bintang ulasan Google Review bisnis tersebut dalam waktu kurang dari 2 detik.

**Sebagai Admin / Pembuat Kartu:**

- Saya ingin membuat ribuan ID unik kartu di database dan meng-generate QR Code/NFC secara massal (bulk) sebelum kartu fisik dicetak dan dijual.

## 3. System Architecture & Dynamic QR Code Flow

### 3.1 Konsep Generasi QR Code & NFC pada Kartu Kosong
URL Permanen: QR Code yang dicetak dan Chip NFC yang diisi sejak awal tidak berisi link Google Review langsung, melainkan URL permanen dari domain platform kamu (Contoh: [https://brandkamu.com/c/CARD-001](https://brandkamu.com/c/CARD-001)).
Sifat QR Code (Dynamic Redirection): Gambar QR Code pada kartu fisik tidak akan pernah berubah meskipun bisnis yang menggunakan kartu tersebut berganti nama atau link ulasan.
Batch Generation (Admin): Admin mencetak QR Code / mengisi NFC secara bulk dengan format [https://brandkamu.com/c/](https://brandkamu.com/c/)[CARD_ID] dan mendaftarkan entri ID tersebut di database dengan status default is_active = false.
### 3.2 Alur Sistem Ringkas

**Pencetakan Kartu:** Kartu fisik dicetak dengan QR Code/NFC berisi URL Unik: https://[domain-kamu].com/c/[CARD_ID] (Contoh: /c/CARD-001).

**Scan / Tap Pertama (Status: INACTIVE):**                                      

- Server memeriksa database -> Status is_active = false.
- User diarahkan ke halaman Form Aktivasi.
- User menginput: Nama Bisnis, Link Direct Google Review, dan PIN 4-digit.
- Data disimpan ke database, status berubah menjadi is_active = true.

**Scan / Tap Kedua & Seterusnya (Status: ACTIVE):**

- Server memeriksa database -> Status is_active = true.
- Server melakukan HTTP Redirect (302/307) langsung ke Link Google Review bisnis tersebut.

**Perubahan Data (Edit Mode):**

- Pemilik bisnis mengakses URL /c/[CARD_ID]/edit atau menekan tombol edit, memasukkan PIN 4-digit, dan memperbarui URL/Nama Bisnis.

## 4. Technical Requirements & Database Schema

### 4.1 Database Schema (Supabase / PostgreSQL)

**Tabel Utama: cards**

| Column Name | Data Type | Constraints | Description |
| --- | --- | --- | --- |
| id | VARCHAR(50) | PRIMARY KEY | Unique ID kartu (e.g., CARD-001, CARD-002) |
| is_active | BOOLEAN | DEFAULT FALSE | Status aktivasi kartu |
| business_name | VARCHAR(150) | NULLABLE | Nama bisnis/UMKM |
| review_url | TEXT | NULLABLE | Link direct Google Review |
| pin | VARCHAR(4) | NULLABLE | PIN 4 digit keamanan |
| scan_count | INTEGER | DEFAULT 0 | Total kali kartu di-scan |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp pembuatan kartu |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp update terakhir |

## 5. Functional Requirements & Feature Breakdown

**Fase 0: Admin Bulk Card & QR Code Generator (Tambahan Baru)**

- Fitur: Generasi ID Kartu dan URL QR Code secara otomatis dalam jumlah banyak (misal: CARD-001 s/d CARD-1000).
- Output: Menghasilkan file CSV/ZIP berisi daftar URL dan file gambar QR Code siap cetak ke kartu fisik.

**Fase 1: Dynamic Route Handler (/c/[cardId])**

**Logic:**

- Terima parameter cardId dari URL.
- Query database Supabase SELECT * FROM cards WHERE id = cardId.
- Jika ID tidak ada -> Tampilkan Halaman 404 / "Kartu Tidak Valid".
- Jika is_active == true -> Incremental update scan_count (+1), lalu panggil redirect(review_url).
- Jika is_active == false -> Tampilkan Komponen Form Aktivasi.

**Fase 2: Interface Aktivasi Kartu**

**Form Inputs:**

- Input Text: Nama Bisnis (Required).
- Input URL: Link Google Review (Required, validasi format URL).
- Input Password/Number: PIN 4 Digit (Required, max length 4).

**Action:**

- Submit form mengirim data via Server Action / API Route ke Supabase.
- Tampilkan modal feedback sukses.

**Fase 3: Interface Edit Data (/c/[cardId]/edit)**

- Meminta input PIN 4 digit.
- Jika PIN cocok -> Tampilkan form edit Nama Bisnis & Link Google Review.
- Jika PIN salah -> Tampilkan error notification.

## 6. Non-Functional Requirements

- Performance: Waktu redirection saat di-scan harus di bawah 1.5 detik (menggunakan Vercel Edge Runtime / Caching Strategy).
- Cost Efficiency: Didesain untuk tetap berjalan pada Free Tier Vercel & Supabase tanpa biaya operasional bulanan hingga skala ribuan kartu.
- Security: Rate limiting pada input PIN untuk mencegah serangan brute force.
