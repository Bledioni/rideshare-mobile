"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Njoftim = {
  id: string;
  lloji: "kerkese_e_re" | "kerkese_pranuar";
  udhetimId: string;
  nisja: string;
  destinacioni: string;
  ora: string;
  udhetari?: string;
  shoferi?: string;
  koha: string;
};

const INTERVALI_MS = 5000;
const ZHDUKET_PAS_MS = 12000;
// Në hapjen e parë në këtë pajisje shfaqen vetëm njoftimet e 30 minutave të fundit.
const DRITARJA_FILLESTARE_MS = 30 * 60 * 1000;

function titulli(n: Njoftim) {
  return n.lloji === "kerkese_e_re" ? "Kërkesë e re për vend" : "Kërkesa u pranua!";
}
function teksti(n: Njoftim) {
  return n.lloji === "kerkese_e_re"
    ? `${n.udhetari} kërkoi një vend në ${n.nisja} → ${n.destinacioni} (${n.ora}).`
    : `${n.shoferi} të pranoi në ${n.nisja} → ${n.destinacioni} (${n.ora}). Vendi yt u konfirmua.`;
}

/**
 * Njoftime pop-up për gjithë aplikacionin.
 * Lexon /api/njoftimet çdo 5 sekonda (vetëm kur je i kyçur) dhe shfaq
 * një njoftim për çdo kërkesë të re (shoferi) ose kërkesë të pranuar (udhëtari).
 * ID-të e shfaqura ruhen në localStorage që njoftimi të mos përsëritet.
 */
export function Njoftimet() {
  const [lista, setLista] = useState<Njoftim[]>([]);
  const timerat = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const mbyll = useCallback((id: string) => {
    setLista((l) => l.filter((n) => n.id !== id));
    const t = timerat.current.get(id);
    if (t) clearTimeout(t);
    timerat.current.delete(id);
  }, []);

  useEffect(() => {
    let aktiv = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let kontrolli: AbortController | null = null;
    const timeratAktive = timerat.current;

    async function lexo() {
      if (timer) clearTimeout(timer);
      kontrolli?.abort();
      const ac = new AbortController();
      kontrolli = ac;
      try {
        const res = await fetch("/api/njoftimet", { cache: "no-store", signal: ac.signal });
        if (res.status === 401) return; // mysafir: nuk ka njoftime, ndalo leximin
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { perdoruesi: string; njoftimet: Njoftim[] };
        if (!aktiv) return;

        const celesi = `rideshare:njoftimet:${data.perdoruesi}`;
        const ruajtur = localStorage.getItem(celesi);
        const pare = new Set<string>(ruajtur ? JSON.parse(ruajtur) : []);
        const tani = Date.now();
        const teReja = data.njoftimet.filter((n) =>
          !pare.has(n.id) &&
          (ruajtur !== null || tani - new Date(n.koha).getTime() < DRITARJA_FILLESTARE_MS),
        );
        // Mbaj vetëm ID-të që ende ekzistojnë, plus të rejat.
        const aktuale = new Set(data.njoftimet.map((n) => n.id));
        const perRuajtje = [...pare].filter((id) => aktuale.has(id));
        data.njoftimet.forEach((n) => { if (!pare.has(n.id)) perRuajtje.push(n.id); });
        localStorage.setItem(celesi, JSON.stringify(perRuajtje));

        if (teReja.length > 0) {
          setLista((l) => [...teReja, ...l].slice(0, 4));
          teReja.forEach((n) => {
            timeratAktive.set(n.id, setTimeout(() => mbyll(n.id), ZHDUKET_PAS_MS));
            if (document.hidden && "Notification" in window && Notification.permission === "granted") {
              new Notification(titulli(n), { body: teksti(n), icon: "/icons/icon-192.png", tag: n.id });
            }
          });
          // Faqja e detajeve rilexon gjendjen menjëherë.
          window.dispatchEvent(new Event("rideshare:rilexo"));
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        // Gabim rrjeti: provo sërish në ciklin e radhës.
      }
      if (aktiv) timer = setTimeout(lexo, INTERVALI_MS);
    }

    lexo();
    const neRikthim = () => { if (!document.hidden) void lexo(); };
    window.addEventListener("online", neRikthim);
    document.addEventListener("visibilitychange", neRikthim);
    return () => {
      aktiv = false;
      if (timer) clearTimeout(timer);
      kontrolli?.abort();
      window.removeEventListener("online", neRikthim);
      document.removeEventListener("visibilitychange", neRikthim);
      timeratAktive.forEach(clearTimeout);
      timeratAktive.clear();
    };
  }, [mbyll]);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {lista.map((n) => (
        <div
          key={n.id}
          className={`toast ${n.lloji === "kerkese_pranuar" ? "toast--success" : "toast--info"}`}
          role="status"
        >
          <span className="toast__icon" aria-hidden>
            {n.lloji === "kerkese_pranuar" ? "✓" : "🔔"}
          </span>
          <div className="toast__body">
            <strong>{titulli(n)}</strong>
            <p>{teksti(n)}</p>
            <Link className="toast__link" href={`/udhetimi/${n.udhetimId}`} onClick={() => mbyll(n.id)}>
              {n.lloji === "kerkese_e_re" ? "Shiko dhe prano →" : "Shiko udhëtimin →"}
            </Link>
          </div>
          <button className="toast__close" type="button" aria-label="Mbyll njoftimin" onClick={() => mbyll(n.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
