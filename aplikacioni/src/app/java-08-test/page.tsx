import Link from "next/link";
import { ZgjedhVendtakimin } from "@/components/VendtakimiLokale";

// Faqe prove për Java 8: të dhëna fiktive, pa login, pa Neon.
// Përdor të njëjtin komponent si te /udhetimi/[id].
const udhetimiFiktiv = {
  shoferi: "Dritoni",
  nisja: "Ferizaj",
  destinacioni: "AAB",
  ora: "08:15",
  vende: 2,
};

export default function Java08Test() {
  const u = udhetimiFiktiv;
  return (
    <main>
      <Link className="back-link" href="/">← Kthehu te lista</Link>
      <h1>{u.nisja} – {u.destinacioni}</h1>
      <p>Shoferi: {u.shoferi} (fiktiv)</p>
      <p>Ora: {u.ora}</p>
      <p>Vende të lira: {u.vende}</p>
      <ZgjedhVendtakimin />
      <p>Faqe prove lokale · të dhëna fiktive · koordinatat nuk ruhen dhe nuk dërgohen.</p>
    </main>
  );
}
