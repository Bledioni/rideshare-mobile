"use client";

import { useEffect, useRef, useState } from "react";

type StatusiKerkeses = "ne_pritje" | "pranuar";
type Gjendja = {
  udhetim: {
    id: string; nisja: string; destinacioni: string; ora: string;
    vendtakimi: string; vende: number; shoferi: string | null;
  };
  roli: "shofer" | "udhetar" | "mysafir";
  kerkesaIme: { id: string; statusi: StatusiKerkeses } | null;
  kerkesat: { id: string; udhetari: string; statusi: StatusiKerkeses }[];
  lexuarMe: string;
};

const INTERVALI_MS = 5000;
const emriStatusit = (s: StatusiKerkeses) => (s === "pranuar" ? "U pranua" : "Në pritje");

/**
 * Java 10: rilexon gjendjen nga serveri çdo 5 sekonda.
 * - Leximi i radhës planifikohet vetëm pasi mbaron i mëparshmi; një lexim i ri anulon të vjetrin.
 * - Timer-i dhe kërkesa në pritje pastrohen kur largohesh nga faqja.
 * - Nëse leximi dështon, mbahen vlerat e fundit dhe shfaqet "Po rilidhemi".
 */
export function GjendjaUdhetimit({ udhetimId }: { udhetimId: string }) {
  const [gjendja, setGjendja] = useState<Gjendja | null>(null);
  const [offline, setOffline] = useState(false);
  const [duke, setDuke] = useState<string | null>(null); // veprimi në pritje
  const [mesazhi, setMesazhi] = useState<{ tekst: string; gabim: boolean } | null>(null);
  const [vendtakimiNdryshoi, setVendtakimiNdryshoi] = useState(false);

  // Thirret pas një veprimi ose rikthimi të rrjetit për të lexuar menjëherë.
  const lexoTani = useRef<() => void>(() => {});

  useEffect(() => {
    let aktiv = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let kontrolli: AbortController | null = null;
    let numeruesi = 0; // përgjigjet e vjetruara injorohen
    let vendtakimiIFundit: string | null = null;

    async function lexo() {
      if (timer) clearTimeout(timer);
      kontrolli?.abort(); // asnjë lexim i dytë paralel: i vjetri anulohet
      const nr = ++numeruesi;
      const ac = new AbortController();
      kontrolli = ac;
      try {
        const res = await fetch(`/api/udhetimet/${encodeURIComponent(udhetimId)}/gjendja`, {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Gjendja;
        if (aktiv && nr === numeruesi) {
          // Udhëtari njoftohet kur shoferi e ndryshon vendtakimin.
          if (vendtakimiIFundit !== null && vendtakimiIFundit !== data.udhetim.vendtakimi) {
            setVendtakimiNdryshoi(true);
          }
          vendtakimiIFundit = data.udhetim.vendtakimi;
          setGjendja(data);
          setOffline(false); // paralajmërimi hiqet vetëm pas suksesit
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // u zëvendësua nga një lexim më i ri
        if (aktiv && nr === numeruesi) setOffline(true); // mbahen vlerat e fundit
      }
      // I radhësi planifikohet vetëm pasi mbaron ky.
      if (aktiv && nr === numeruesi) timer = setTimeout(lexo, INTERVALI_MS);
    }

    lexoTani.current = () => void lexo();
    lexo();
    // Pas rikthimit të rrjetit, lexo menjëherë pa pritur timer-in.
    const neRikthim = () => void lexo();
    window.addEventListener("online", neRikthim);
    // Pas një ndryshimi në këtë dritare (p.sh. vendtakimi), lexo menjëherë.
    window.addEventListener("rideshare:rilexo", neRikthim);
    return () => {
      aktiv = false;
      window.removeEventListener("online", neRikthim);
      window.removeEventListener("rideshare:rilexo", neRikthim);
      if (timer) clearTimeout(timer);
      kontrolli?.abort();
      lexoTani.current = () => {};
    };
  }, [udhetimId]);

  async function dergo(url: string, celesi: string) {
    setDuke(celesi);
    setMesazhi(null);
    try {
      const res = await fetch(url, { method: "POST", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setMesazhi({ tekst: data.mesazhi ?? data.error ?? "Veprimi nuk u ruajt.", gabim: !res.ok });
    } catch {
      setMesazhi({ tekst: "Nuk u lidhëm me serverin. Veprimi nuk u ruajt.", gabim: true });
    } finally {
      setDuke(null);
      // Suksesi tregohet nga gjendja që kthen serveri, jo nga supozimi në ekran.
      lexoTani.current();
    }
  }

  if (!gjendja) {
    return (
      <section className="sync-card" aria-live="polite">
        {offline ? (
          <p className="sync-warning" role="alert">Po rilidhemi · gjendja nuk u lexua ende.</p>
        ) : (
          <p>Po lexohet gjendja nga serveri…</p>
        )}
      </section>
    );
  }

  const { udhetim, roli, kerkesaIme, kerkesat } = gjendja;
  const bllokuar = offline || duke !== null;

  return (
    <section className="sync-card" aria-live="polite">
      <div className="sync-card__head">
        <h2>Gjendja e udhëtimit</h2>
        <span className="sync-role">
          {roli === "shofer" ? "Ti je shoferi" : roli === "udhetar" ? "Udhëtar" : "Mysafir"}
        </span>
      </div>
      <dl className="sync-grid">
        <div><dt>Nisja</dt><dd>{udhetim.ora}</dd></div>
        <div><dt>Shoferi</dt><dd>{udhetim.shoferi ?? "—"}</dd></div>
        <div><dt>Vende të lira</dt><dd className="sync-seats">{udhetim.vende}</dd></div>
        <div><dt>Statusi</dt><dd>
          <span className={udhetim.vende > 0 ? "badge badge--success" : "badge badge--muted"}>
            {udhetim.vende > 0 ? "Aktiv" : "Plot"}
          </span>
        </dd></div>
        <div className="sync-grid__wide"><dt>Vendtakimi</dt><dd>📍 {udhetim.vendtakimi}</dd></div>
      </dl>

      {vendtakimiNdryshoi && roli !== "shofer" && (
        <p className="sync-notice" role="status">
          Shoferi e ndryshoi vendtakimin: <strong>{udhetim.vendtakimi}</strong>{" "}
          <button className="sync-notice__close" onClick={() => setVendtakimiNdryshoi(false)}>OK</button>
        </p>
      )}

      {roli === "shofer" && (
        <div className="sync-requests">
          <h3>Kërkesat <span className="badge">{kerkesat.length}</span></h3>
          {kerkesat.length === 0 ? <p>Ende pa kërkesë.</p> : (
            <ul>
              {kerkesat.map((k) => (
                <li key={k.id}>
                  <span className="request">
                    <span className="avatar" aria-hidden>{k.udhetari.charAt(0).toUpperCase()}</span>
                    <span>
                      <strong>{k.udhetari}</strong>
                      <span className={k.statusi === "pranuar" ? "badge badge--success" : "badge badge--warning"}>
                        {emriStatusit(k.statusi)}
                      </span>
                    </span>
                  </span>
                  {k.statusi === "ne_pritje" && (
                    <button
                      className="button"
                      disabled={bllokuar || udhetim.vende <= 0}
                      onClick={() => dergo(`/api/kerkesat/${k.id}/prano`, `prano-${k.id}`)}
                    >
                      {duke === `prano-${k.id}` ? "Po ruhet…" : udhetim.vende <= 0 ? "Pa vende" : "Prano kërkesën"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {roli === "udhetar" && (
        <div className="sync-requests">
          <h3>Kërkesa ime</h3>
          {kerkesaIme ? (
            <p className="request">
              <span className={kerkesaIme.statusi === "pranuar" ? "badge badge--success" : "badge badge--warning"}>
                {emriStatusit(kerkesaIme.statusi)}
              </span>
              {kerkesaIme.statusi === "pranuar"
                ? "Vendi u konfirmua. Shihemi te vendtakimi!"
                : "Kërkesa u dërgua. Do të njoftohesh kur shoferi ta pranojë."}
            </p>
          ) : (
            <>
              <p className="muted">Ende nuk ke kërkuar vend në këtë udhëtim.</p>
              <button
                className="button"
                disabled={bllokuar || udhetim.vende <= 0}
                onClick={() => dergo(`/api/udhetimet/${encodeURIComponent(udhetim.id)}/kerkesa`, "kerko")}
              >
                {duke === "kerko" ? "Po dërgohet…" : udhetim.vende > 0 ? "Kërko një vend" : "Nuk ka vende të lira"}
              </button>
            </>
          )}
        </div>
      )}

      {roli === "mysafir" && (
        <p className="sync-requests muted">
          Hyr nga <a href="/panel">Paneli im</a> për të kërkuar vend.
        </p>
      )}

      {mesazhi && (
        <p className={mesazhi.gabim ? "sync-message sync-message--error" : "sync-message"} role="status">
          {mesazhi.tekst}
        </p>
      )}

      {offline ? (
        <p className="sync-warning" role="alert">
          Po rilidhemi · të dhënat mund të jenë të vjetra. Veprimet që kërkojnë rrjet janë të bllokuara.
        </p>
      ) : (
        <p className="sync-footer">
          <span className="live-dot" aria-hidden /> Gjendja u lexua nga serveri · {new Date(gjendja.lexuarMe).toLocaleTimeString("sq-AL")} ·
          përditësim automatik çdo 5 sekonda
        </p>
      )}
    </section>
  );
}
