import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ActivationForm } from "@/components/ActivationForm";
import { getCard } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Aktivasi Kartu",
  robots: { index: false, follow: false },
};

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export default async function CardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  if (!CARD_ID_RE.test(cardId)) notFound();

  const card = await getCard(cardId);
  if (!card) notFound();

  if (card.is_active && card.review_url) {
    redirect(card.review_url);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <ActivationForm cardId={card.id} />
      <p className="mt-6 text-xs text-zinc-400">ReviewKU QR</p>
    </main>
  );
}
