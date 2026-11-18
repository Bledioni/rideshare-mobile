"use client";

import { useRef, useState } from "react";
import { ruajPreferimin } from "@/app/actions";
import type { Udhetim } from "@/lib/udhetimet";
import { KartaUdhetimi } from "./KartaUdhetimi";

export function ListaUdhetimesh({
  udhetimet,
  preferimetFillestare,
  eshteKycur,
  gabimNeLexim,
}: {
  udhetimet: Udhetim[];
  preferimetFillestare: string[];
  eshteKycur: boolean;
  gabimNeLexim: boolean;
}) {
  const [preferimet, setPreferimet] = useState(
    () => new Set(preferimetFillestare),
  );
  const [nePritje, setNePritje] = useState(() => new Set<string>());
  const [gabimet, setGabimet] = useState<Record<string, string>>({});
  const [ruajturNeKeteSesion, setRuajturNeKeteSesion] = useState(
    () => new Set<string>(),
  );
  const kerkesatAktive = useRef(new Set<string>());

  function hiqNgaPreferimet(udhetimId: string) {
    setPreferimet((aktuale) => {
      const eReja = new Set(aktuale);
      eReja.delete(udhetimId);
      return eReja;
    });
  }

  async function ruaj(udhetimId: string) {
    if (
      gabimNeLexim ||
      preferimet.has(udhetimId) ||
      kerkesatAktive.current.has(udhetimId)
    ) {
      return;
    }

    kerkesatAktive.current.add(udhetimId);
    setNePritje((aktuale) => new Set(aktuale).add(udhetimId));
    setPreferimet((aktuale) => new Set(aktuale).add(udhetimId));
    setGabimet((aktuale) => {
      const teReja = { ...aktuale };
      delete teReja[udhetimId];
      return teReja;
    });

    try {
      const rezultati = await ruajPreferimin(udhetimId);
      if (!rezultati.ok) {
        hiqNgaPreferimet(udhetimId);
        setGabimet((aktuale) => ({
          ...aktuale,
          [udhetimId]: rezultati.message,
        }));
        return;
      }

      setRuajturNeKeteSesion((aktuale) =>
        new Set(aktuale).add(udhetimId),
      );
    } catch (error) {
      console.error("Nuk u mor përgjigjja për ruajtjen e preferimit.", error);
      hiqNgaPreferimet(udhetimId);
      setGabimet((aktuale) => ({
        ...aktuale,
        [udhetimId]: "Nuk u ruajt. Provo përsëri.",
      }));
    } finally {
      kerkesatAktive.current.delete(udhetimId);
      setNePritje((aktuale) => {
        const teReja = new Set(aktuale);
        teReja.delete(udhetimId);
        return teReja;
      });
    }
  }

  return (
    <>
      <div className="favorite-summary" aria-live="polite">
        <strong>Të preferuarat</strong>
        <span>
          {eshteKycur && !gabimNeLexim ? preferimet.size : "—"}
        </span>
        <small>Preferim personal · jo rezervim</small>
      </div>
      {gabimNeLexim && (
        <p className="favorite-list-error" role="status">
          Preferimet nuk u lexuan. Kontrollo databazën dhe rifresko.
        </p>
      )}
      <div className="trip-list">
        {udhetimet.map((udhetim) => (
          <KartaUdhetimi
            key={udhetim.id}
            udhetim={udhetim}
            eshteKycur={eshteKycur}
            eshtePreferuar={preferimet.has(udhetim.id)}
            eshteNePritje={nePritje.has(udhetim.id)}
            gabimi={gabimet[udhetim.id]}
            uRuajtTani={ruajturNeKeteSesion.has(udhetim.id)}
            ruajtjaNukEshteGati={gabimNeLexim}
            ruaj={ruaj}
          />
        ))}
      </div>
    </>
  );
}
