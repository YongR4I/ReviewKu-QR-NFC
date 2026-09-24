import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditForm } from "@/components/EditForm";
import { PinGate } from "@/components/PinGate";
import { getCard } from "@/lib/cards";
import { getEditToken, verifyEditToken } from "@/lib/edit-token";

export const metadata: Metadata = {
  title: "Edit Data Kartu",
  robots: { index: false, follow: false },
};

const CARD_ID_RE = /^[A-Za-z0-9_-]{1,50}$/;

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  if (!CARD_ID_RE.test(cardId)) notFound();

  const card = await getCard(cardId);
  if (!card) notFound();
  if (!card.is_active) redirect(`/c/${cardId}`);

  const token = await getEditToken();
  const authorized = verifyEditToken(cardId, token);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      {authorized ? (
        <EditForm
          cardId={card.id}
          initialBusinessName={card.business_name ?? ""}
          initialReviewUrl={card.review_url ?? ""}
        />
      ) : (
        <PinGate cardId={card.id} />
      )}
      <p className="mt-6 text-xs text-zinc-400">ReviewKU QR</p>
    </main>
  );
}
