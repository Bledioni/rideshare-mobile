import Link from "next/link";
import { notFound } from "next/navigation";
import { GjendjaUdhetimit } from "@/components/GjendjaUdhetimit";
import { ZgjedhVendtakimin } from "@/components/VendtakimiLokale";
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
        <h1>RideShare</h1>
        <p role="alert">Nuk u lidhëm me databazën. Provo përsëri.</p>
        <Link href="/">← Kthehu te lista</Link>
      </main>
    );
  }
  if (!udhetim) notFound();

  return (
    <main>
      <Link href="/">← Kthehu te lista</Link>
      <h1>{udhetim.nisja} – {udhetim.destinacioni}</h1>
      <p>Ora: {udhetim.ora}</p>
      <p>Vendtakimi: {udhetim.vendtakimi}</p>
      {/* Java 10: vendet, kërkesa dhe pranimi rilexohen nga serveri çdo 5 sekonda. */}
      <GjendjaUdhetimit udhetimId={udhetim.id} />
      {/* Java 8: komponent klienti; leja kërkohet vetëm pas klikimit. */}
      <ZgjedhVendtakimin />
    </main>
  );
}
