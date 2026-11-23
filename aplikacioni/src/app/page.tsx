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
        <section className="empty-state">
          <h1>Diçka nuk shkoi mirë</h1>
          <p role="alert">Nuk u lidhëm me databazën. Provo përsëri.</p>
          <div className="row">
            <a className="button" href="/">Provo përsëri</a>
            <Link className="button button--ghost" href="/panel">Paneli im</Link>
          </div>
        </section>
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
      <section className="hero">
        <p className="eyebrow">Udhëtime të përbashkëta · AAB</p>
        <h1>Gjej një vend për në universitet.</h1>
        <p className="hero__lead">
          Shoferët publikojnë udhëtimet, udhëtarët kërkojnë vend dhe të dy njoftohen
          menjëherë kur kërkesa dërgohet ose pranohet.
        </p>
        <div className="row">
          <a className="button" href="#udhetimet">Shiko udhëtimet</a>
          <Link className="button button--ghost" href="/panel">
            {eshteKycur ? "Paneli im" : "Hyr me GitHub"}
          </Link>
        </div>
      </section>

      <div className="section-head" id="udhetimet">
        <h2>Udhëtimet e disponueshme</h2>
        <span className="muted small">{udhetimet.length} udhëtime · të dhëna fiktive për ushtrime</span>
      </div>
      {udhetimet.length === 0 ? (
        <p className="empty-state">Nuk ka udhëtime për momentin.</p>
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
