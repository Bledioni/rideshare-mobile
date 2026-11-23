import Link from "next/link";
import Hyrja from "@/components/Hyrja";
import { AktivizoNjoftimet } from "@/components/AktivizoNjoftimet";
import { profiliIm } from "@/lib/lejet";
import { lexoUdhetimetEMia, type UdhetimiIm } from "@/lib/kerkesat";
import { ruajOren, shtoUdhetim } from "./actions";

export const dynamic = "force-dynamic";
const mesazhet: Record<string, string> = {
  hyr: "Hyr në llogari para se të ndryshosh udhëtimin.",
  ndaluar: "Nuk ke leje për këtë udhëtim. Ora nuk ndryshoi.",
  fushe: "Shkruaj një orë të vlefshme, p.sh. 08:25. ID duhet të jetë 1, 2 ose 3.",
  ruajtur: "Ora u ruajt me sukses. Kontrollo listën dhe detajet.",
  databaza: "Nuk u lidhëm me databazën. Kontrollo Neon dhe provo përsëri.",
  krijuar: "Udhëtimi i ri u ruajt në Neon dhe shfaqet te lista.",
  fushe_udhetimi: "Plotëso të gjitha fushat: 2–60 shkronja, ora si 08:15 dhe 1–8 vende.",
};

export default async function Panel({ searchParams }: {
  searchParams: Promise<{ m?: string; id?: string }>;
}) {
  const { m, id: idIRi } = await searchParams;
  let p;
  let teMiat: UdhetimiIm[] = [];
  try {
    p = await profiliIm();
    if (p?.roli === "shofer") teMiat = await lexoUdhetimetEMia(p.id);
  }
  catch { return <main className="app-shell"><section className="empty-state"><h1>Paneli im</h1><p role="alert">{mesazhet.databaza}</p><Link className="button" href="/panel">Provo përsëri</Link></section></main>; }
  const sukses = m === "ruajtur" || m === "krijuar";
  return <main className="app-shell">
    <header className="page-head">
      <p className="eyebrow">Paneli im</p>
      <h1>{p ? `Përshëndetje, ${p.emri}` : "Mirë se erdhe"}</h1>
    </header>
    {m && mesazhet[m] && <p className={sukses ? "alert alert--success" : "alert alert--error"} role="status">
      {mesazhet[m]}{m === "krijuar" && idIRi && /^\d+$/.test(idIRi) && <> <Link href={`/udhetimi/${idIRi}`}>Hap udhëtimin {idIRi}</Link></>}
    </p>}

    <section className="sync-card profile-card">
      {!p ? <>
        <h2>Hyr në llogari</h2>
        <p className="muted">Lista është publike. Për panelin, kërkesat dhe njoftimet hyr me llogarinë tënde GitHub.</p>
      </> : <div className="profile">
        <span className="avatar avatar--lg" aria-hidden>{p.emri.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{p.emri}</strong>
          <p className="muted small">
            <span className="badge">{p.roli === "shofer" ? "Shofer" : "Udhëtar"}</span>{" "}
            ID GitHub: <code>{p.id}</code>
          </p>
        </div>
      </div>}
      <div className="row">
        <Hyrja brenda={Boolean(p)} />
        {p && <AktivizoNjoftimet />}
      </div>
    </section>

    {p?.roli === "shofer" && <section className="sync-card">
      <h2>Udhëtimet e mia</h2>
      {teMiat.length === 0 ? <p className="muted">Nuk ke ende udhëtime. Shto të parin më poshtë.</p> : <ul className="my-trips">
        {teMiat.map((u) => <li key={u.id}>
          <Link href={`/udhetimi/${u.id}`} className="my-trips__link">
            <span className="my-trips__route">{u.nisja} → {u.destinacioni}</span>
            <span className="my-trips__meta">
              <span>🕗 {u.ora}</span>
              <span>{u.vende} vende të lira</span>
              {u.ne_pritje > 0
                ? <span className="badge badge--warning">{u.ne_pritje} kërkesa në pritje</span>
                : <span className="badge badge--muted">Pa kërkesa të reja</span>}
            </span>
          </Link>
        </li>)}
      </ul>}
    </section>}

    {p?.roli === "shofer" && <form action={shtoUdhetim} className="sync-card new-trip">
      <h2>Shto udhëtim të ri</h2>
      <div className="form-grid">
        <label>Nisja<input name="nisja" required minLength={2} maxLength={60} placeholder="P.sh. Ferizaj" /></label>
        <label>Destinacioni<input name="destinacioni" required minLength={2} maxLength={60} defaultValue="AAB" /></label>
        <label>Ora e nisjes<input name="ora" type="time" required defaultValue="08:15" /></label>
        <label>Vende të lira<input name="vende" type="number" required min={1} max={8} defaultValue={2} /></label>
        <label className="form-grid__wide">Vendtakimi<input name="vendtakimi" required minLength={2} maxLength={60} placeholder="P.sh. Te sheshi" /></label>
      </div>
      <button className="button" type="submit">Publiko udhëtimin</button>
      <p className="sync-footer">Ti je shoferi pronar. Do të njoftohesh sapo dikush kërkon vend.</p>
    </form>}

    {p?.roli === "shofer" ? <form action={ruajOren} className="sync-card new-trip">
      <h2>Ndrysho orën e udhëtimit tim</h2>
      <input type="hidden" name="id" value="2" />
      <div className="row">
        <label htmlFor="ora">Ora e re<input id="ora" name="ora" type="time" defaultValue="08:15" required /></label>
        <button className="button button--ghost" type="submit">Ruaj orën</button>
      </div>
      <p className="sync-footer">Formulari i laboratorit provon ID 2. Serveri verifikon pronarin edhe nëse ID ndryshohet.</p>
    </form> : p && <p className="muted">Si udhëtar mund të kërkosh vend te çdo udhëtim. Do të njoftohesh kur shoferi të pranon.</p>}

    <p className="row">
      <Link className="button button--ghost" href="/">← Kthehu te udhëtimet</Link>
    </p>
  </main>;
}
