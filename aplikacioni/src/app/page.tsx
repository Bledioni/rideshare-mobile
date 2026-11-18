import Link from "next/link";
import { getServerSession } from "next-auth";
import { ListaUdhetimesh } from "@/components/ListaUdhetimesh";
import { authOptions } from "@/lib/auth";
import { lexoPreferimet } from "@/lib/preferimet";
import { lexoUdhetimet, type Udhetim } from "@/lib/udhetimet";

// Lexo bazën përsëri në çdo kërkesë për këtë faqe.
export const dynamic = "force-dynamic";

export default async function Home() {
  let udhetimet: Udhetim[];
  try {
    udhetimet = await lexoUdhetimet();
  } catch {
    return (
      <main>
        <h1>RideShare</h1>
        <p><Link href="/panel">Hyr / Paneli im</Link></p>
        <p role="alert">Nuk u lidhëm me databazën. Provo përsëri.</p>
        <a className="action" href="/">Provo përsëri</a>
      </main>
    );
  }

  // Preferimet lexohen nga serveri për përdoruesin e kyçur (ID nga sesioni).
  let eshteKycur = false;
  let preferimet: string[] = [];
  let gabimNeLexim = false;
  try {
    const session = await getServerSession(authOptions);
    const githubId = session?.user?.id;
    if (githubId && /^\d+$/.test(githubId)) {
      eshteKycur = true;
      preferimet = await lexoPreferimet(githubId);
    }
  } catch (error) {
    console.error("Nuk u lexuan preferimet.", error);
    gabimNeLexim = true;
  }

  return (
    <main>
      <h1>RideShare · Udhëtimet për AAB</h1>
      <p><Link href="/panel">Hyr / Paneli im</Link></p>
      <p>Burimi: Neon · të dhëna fiktive për ushtrime</p>
      {udhetimet.length === 0 ? (
        <p>Nuk ka udhëtime për momentin.</p>
      ) : (
        <ListaUdhetimesh
          udhetimet={udhetimet}
          preferimetFillestare={preferimet}
          eshteKycur={eshteKycur}
          gabimNeLexim={gabimNeLexim}
        />
      )}
    </main>
  );
}
