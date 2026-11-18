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

  return (
    <article className="trip-card">
      <h2>{udhetim.nisja} – {udhetim.destinacioni}</h2>
      <p>
        Ora: {udhetim.ora} ·{" "}
        {udhetim.vende > 0 ? `Vende të lira: ${udhetim.vende}` : "Nuk ka vende të lira"}
      </p>
      <Link className="action" href={`/udhetimi/${udhetim.id}`}>
        Shiko detajet
      </Link>
      <div className="favorite-control">
        {eshteKycur ? (
          <button
            className="favorite-button"
            type="button"
            onClick={() => void ruaj(udhetim.id)}
            disabled={eshtePreferuar || eshteNePritje || ruajtjaNukEshteGati}
          >
            {etiketa}
          </button>
        ) : (
          <Link className="favorite-button" href="/panel">
            Hyr me GitHub për të ruajtur
          </Link>
        )}
        {eshteKycur && (
          <p
            className={gabimi ? "favorite-message favorite-message--error" : "favorite-message"}
            aria-live="polite"
          >
            {mesazhi}
          </p>
        )}
      </div>
    </article>
  );
}
