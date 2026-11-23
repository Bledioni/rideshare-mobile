import Link from "next/link";
import { notFound } from "next/navigation";
import { GjendjaUdhetimit } from "@/components/GjendjaUdhetimit";
import { ZgjedhVendtakimin } from "@/components/VendtakimiLokale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSql } from "@/lib/db";
import { gjejUdhetimin } from "@/lib/udhetimet";

export const dynamic = "force-dynamic";

export default async function Detajet({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let udhetim;
  try {
    udhetim = await gjejUdhetimin(id);
  } catch {
    return (
      <main>
        <Link className="back-link" href="/">← Kthehu te lista</Link>
        <section className="empty-state">
          <h1>Diçka nuk shkoi mirë</h1>
          <p role="alert">Nuk u lidhëm me databazën. Provo përsëri.</p>
        </section>
      </main>
    );
  }
  if (!udhetim) notFound();

  // Shoferi pronar njihet nga sesioni dhe udhëtimi, jo nga URL-ja.
  let eshtePronar = false;
  try {
    const session = await getServerSession(authOptions);
    const githubId = session?.user?.id;
    if (githubId && /^\d+$/.test(githubId)) {
      const rows = await getSql()`SELECT 1 FROM udhetimet WHERE id = ${id} AND shofer_id = ${githubId}`;
      eshtePronar = rows.length === 1;
    }
  } catch {
    eshtePronar = false;
  }

  return (
    <main>
      <Link className="back-link" href="/">← Kthehu te lista</Link>
      <header className="page-head">
        <p className="eyebrow">Udhëtimi #{udhetim.id}</p>
        <h1>{udhetim.nisja} <span className="trip-card__arrow">→</span> {udhetim.destinacioni}</h1>
        <p className="muted">Nisja në orën <strong>{udhetim.ora}</strong></p>
      </header>
      {/* Java 10: vendet, kërkesa, pranimi dhe vendtakimi rilexohen nga serveri çdo 5 sekonda. */}
      <GjendjaUdhetimit udhetimId={udhetim.id} />
      {/* Java 8 + 10: vetëm shoferi pronar e ndryshon vendtakimin; ruhet në server. */}
      {eshtePronar && <ZgjedhVendtakimin udhetimId={udhetim.id} fillestar={udhetim.vendtakimi} />}
    </main>
  );
}
