"use client";

import { useEffect, useRef, useState } from "react";

type StatusiKerkeses = "ne_pritje" | "pranuar";
type Gjendja = {
  udhetim: { id: string; nisja: string; destinacioni: string; ora: string; vende: number; shoferi: string | null };
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

  // Thirret pas një veprimi ose rikthimi të rrjetit për të lexuar menjëherë.
  const lexoTani = useRef<() => void>(() => {});

  useEffect(() => {
    let aktiv = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let kontrolli: AbortController | null = null;
    let numeruesi = 0; // përgjigjet e vjetruara injorohen

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
    return () => {
      aktiv = false;
      window.removeEventListener("online", neRikthim);
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
      <p className="sync-role">
        {roli === "shofer" ? "Shofer" : roli === "udhetar" ? "Udhëtar" : "Mysafir"}
      </p>
      <h2>Udhëtimi {udhetim.id} · {udhetim.nisja} → {udhetim.destinacioni}</h2>
      <dl className="sync-grid">
        <div><dt>Nisja</dt><dd>{udhetim.ora}</dd></div>
        <div><dt>Shoferi</dt><dd>{udhetim.shoferi ?? "—"}</dd></div>
        <div><dt>Vende të lira</dt><dd className="sync-seats">{udhetim.vende}</dd></div>
        <div><dt>Statusi</dt><dd>{udhetim.vende > 0 ? "Aktiv" : "Plot"}</dd></div>
      </dl>

      {roli === "shofer" && (
        <div className="sync-requests">
          <h3>Kërkesat</h3>
          {kerkesat.length === 0 ? <p>Ende pa kërkesë.</p> : (
            <ul>
              {kerkesat.map((k) => (
                <li key={k.id}>
                  <span>{k.udhetari} · <strong>{emriStatusit(k.statusi)}</strong></span>
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
            <p>
              <strong>{emriStatusit(kerkesaIme.statusi)}</strong>{" · "}
              {kerkesaIme.statusi === "pranuar" ? "Vendi u konfirmua." : "Kërkesa u dërgua."}
            </p>
          ) : (
            <>
              <p>Pa kërkesë.</p>
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

      {roli === "mysafir" && <p>Hyr nga <a href="/panel">Paneli im</a> për të kërkuar vend.</p>}

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
          Gjendja u lexua nga serveri · {new Date(gjendja.lexuarMe).toLocaleTimeString("sq-AL")} ·
          përditësim automatik çdo 5 sekonda
        </p>
      )}
    </section>
  );
}
