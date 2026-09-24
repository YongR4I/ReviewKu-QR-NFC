import Link from "next/link";

const steps = [
  {
    n: "1",
    title: "Kartu di-scan pertama kali",
    desc: "Formulir aktivasi muncul. Pemilik mengisi nama bisnis, link Google Review, dan PIN 4 digit.",
  },
  {
    n: "2",
    title: "Data tersimpan permanen",
    desc: "Kartu berstatus aktif. QR dan NFC tetap sama — tidak perlu dicetak ulang walau link berubah.",
  },
  {
    n: "3",
    title: "Scan berikutnya langsung ke Google",
    desc: "Pelanggan diarahkan ke halaman ulasan Google dalam hitungan milidetik.",
  },
];

const features = [
  {
    icon: " blank",
    title: "Kartu Blank",
    desc: "Cetak massal tanpa data. Satu URL platform untuk semua kartu.",
  },
  {
    icon: "✏️",
    title: "Edit Kapan Saja",
    desc: "Ganti nama bisnis atau link review lewat PIN, tanpa cetak ulang.",
  },
  {
    icon: "🔒",
    title: "PIN 4 Digit",
    desc: "Data hanya bisa diubah pemilik kartu yang memegang PIN.",
  },
  {
    icon: "📊",
    title: "Statistik Scan",
    desc: "Pantau berapa kali setiap kartu di-scan dari panel admin.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">
          ReviewKU <span className="text-zinc-400">QR</span>
        </span>
        <nav className="flex items-center gap-5 text-sm">
          <a
            href="#cara-kerja"
            className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Cara Kerja
          </a>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-300 px-3.5 py-1.5 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Admin
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6">
        <section className="flex flex-col items-center py-16 text-center sm:py-24">
          <span className="mb-5 rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            ⚡ QR &amp; NFC · Aktivasi mandiri
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Kumpulkan ulasan Google hanya dengan sekali tap
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Kartu blank dengan QR/NFC dinamis untuk UMKM, kafe, klinik, dan
            restoran. Aktivasi sendiri dalam 30 detik — pelanggan langsung
            diarahkan ke halaman review Google bisnismu.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#cara-kerja"
              className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Cara Kerja
            </a>
            <a
              href="/admin"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-300 px-6 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Panel Admin
            </a>
          </div>
        </section>

        <section id="cara-kerja" className="py-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Cara kerja
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {step.n}
                </div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="text-2xl">{feature.icon.trim()}</div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        ReviewKU QR · Platform aktivasi kartu QR/NFC untuk Google Review
      </footer>
    </div>
  );
}
