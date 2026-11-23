"use client";

import Link from "next/link";
import type { Udhetim } from "@/lib/udhetimet";

export function KartaUdhetimi({
  udhetim,
  eshteKycur,
  eshtePreferuar,
  eshteNePritje,
  gabimi,
  uRuajtTani,
  ruajtjaNukEshteGati,
  ruaj,
}: {
  udhetim: Udhetim;
  eshteKycur: boolean;
  eshtePreferuar: boolean;
  eshteNePritje: boolean;
  gabimi?: string;
  uRuajtTani: boolean;
  ruajtjaNukEshteGati: boolean;
  ruaj: (id: string) => Promise<void>;
}) {
  // Ylli i mbushur gjatë pritjes është vetëm parashikim, jo konfirmim.
  const etiketa = eshteNePritje
    ? "★ Po ruhet…"
    : eshtePreferuar
      ? "★ I ruajtur"
      : gabimi
        ? "☆ Provo përsëri"
        : "☆ Ruaj udhëtimin";

  const mesazhi = eshteNePritje
    ? "Po presim konfirmimin e serverit."
    : gabimi ??
      (eshtePreferuar
        ? uRuajtTani
          ? "U ruajt te të preferuarat."
          : "Preferimet u lexuan nga serveri."
        : "Nuk është te të preferuarat.");

  const plot = udhetim.vende <= 0;
  return (
    <article className="trip-card">
      <div className="trip-card__top">
        <span className="trip-card__time">{udhetim.ora}</span>
        <span className={plot ? "badge badge--muted" : "badge badge--success"}>
          {plot ? "Plot" : `${udhetim.vende} ${udhetim.vende === 1 ? "vend i lirë" : "vende të lira"}`}
        </span>
      </div>
      <h3 className="trip-card__route">
        <span>{udhetim.nisja}</span>
        <span className="trip-card__arrow" aria-hidden>→</span>
        <span>{udhetim.destinacioni}</span>
      </h3>
      <p className="trip-card__meta">📍 {udhetim.vendtakimi}</p>
      <div className="trip-card__actions">
        <Link className="button button--sm" href={`/udhetimi/${udhetim.id}`}>
          Shiko detajet
        </Link>
        {eshteKycur ? (
          <button
            className={eshtePreferuar ? "favorite-button favorite-button--on" : "favorite-button"}
            type="button"
            onClick={() => void ruaj(udhetim.id)}
            disabled={eshtePreferuar || eshteNePritje || ruajtjaNukEshteGati}
          >
            {etiketa}
          </button>
        ) : (
          <Link className="favorite-button" href="/panel">
            Hyr për të ruajtur
          </Link>
        )}
      </div>
      {eshteKycur && (
        <p
          className={gabimi ? "favorite-message favorite-message--error" : "favorite-message"}
          aria-live="polite"
        >
          {mesazhi}
        </p>
      )}
    </article>
  );
}
