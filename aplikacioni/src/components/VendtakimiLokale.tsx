"use client";

import { useState } from "react";

type GjendjaVendndodhjes =
  | "idle"
  | "loading"
  | "success"
  | "denied"
  | "timeout"
  | "unavailable";

/**
 * Pa `udhetimId` (Java 8): zgjedhja mbetet vetëm në këtë pajisje.
 * Me `udhetimId` (Java 10, shoferi pronar): vendtakimi ruhet në server dhe
 * udhëtari e merr me leximin automatik çdo 5 sekonda.
 */
export function ZgjedhVendtakimin({
  udhetimId,
  fillestar = "",
}: { udhetimId?: string; fillestar?: string } = {}) {
  const [teksti, setTeksti] = useState("");
  const [vendtakimi, setVendtakimi] = useState(fillestar);
  const [dukeRuajtur, setDukeRuajtur] = useState(false);
  const [mesazhiRuajtjes, setMesazhiRuajtjes] = useState("");
  const [gabimiTekstit, setGabimiTekstit] = useState("");
  const [gjendja, setGjendja] = useState<GjendjaVendndodhjes>("idle");
  const [mesazhi, setMesazhi] = useState("");
  const [saktesia, setSaktesia] = useState("");

  function konfirmoVendtakimin() {
    const tekstIStervitur = teksti.trim();
    if (!tekstIStervitur) {
      setGabimiTekstit("Shkruaj vendtakimin për të vazhduar.");
      return;
    }

    setGabimiTekstit("");
    if (!udhetimId) {
      setVendtakimi(tekstIStervitur);
      return;
    }
    void ruajNeServer(tekstIStervitur);
  }

  async function ruajNeServer(vendi: string) {
    setDukeRuajtur(true);
    setMesazhiRuajtjes("Po ruhet në server…");
    try {
      const res = await fetch(`/api/udhetimet/${encodeURIComponent(udhetimId!)}/vendtakimi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendtakimi: vendi }),
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGabimiTekstit(data.error ?? "Vendtakimi nuk u ruajt. Provo përsëri.");
        setMesazhiRuajtjes("");
        return;
      }
      // Konfirmohet vetëm pasi serveri e ruan.
      setVendtakimi(data.vendtakimi ?? vendi);
      setTeksti("");
      setMesazhiRuajtjes(data.mesazhi ?? "Vendtakimi u ruajt.");
      window.dispatchEvent(new Event("rideshare:rilexo"));
    } catch {
      setGabimiTekstit("Nuk u lidhëm me serverin. Vendtakimi nuk u ruajt.");
      setMesazhiRuajtjes("");
    } finally {
      setDukeRuajtur(false);
    }
  }

  function lexoVendndodhjen() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGjendja("unavailable");
      setMesazhi("Ky shfletues nuk e mbështet vendndodhjen. Shkruaj vendtakimin vetë.");
      setSaktesia("");
      return;
    }

    setGjendja("loading");
    setMesazhi("Po kërkojmë vendndodhjen…");
    setSaktesia("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSaktesia(`${Math.round(position.coords.accuracy)} m`);
        setGjendja("success");
        setMesazhi("Pozicioni u mor. Zgjidh vetë vendtakimin më të përshtatshëm.");
      },
      (error) => {
        if (error.code === 1) {
          setGjendja("denied");
          setMesazhi("Leja u refuzua. Shkruaj vendtakimin vetë.");
        } else if (error.code === 3) {
          setGjendja("timeout");
          setMesazhi("Koha mbaroi. Shkruaj vendtakimin vetë ose provo sërish.");
        } else {
          setGjendja("unavailable");
          setMesazhi("Pozicioni nuk u gjet. Shkruaj vendtakimin vetë ose provo sërish.");
        }
      },
      { timeout: 10000 },
    );
  }

  return (
    <section className="meeting-picker" aria-labelledby="meeting-picker-title">
      <h2 id="meeting-picker-title">Zgjedh vendtakimin</h2>
      <p className="meeting-picker__intro">
        Shkruaj një vend të dallueshëm ose provo vendndodhjen e telefonit.
        {udhetimId
          ? " Pas konfirmimit ruhet në server dhe udhëtari e sheh pa Refresh."
          : " Zgjedhja mbetet në këtë pajisje."}
      </p>

      <label htmlFor="meeting-input">Shkruaj vendtakimin</label>
      <input
        id="meeting-input"
        data-testid="meeting-input"
        type="text"
        value={teksti}
        onChange={(event) => {
          setTeksti(event.target.value);
          setGabimiTekstit("");
        }}
        placeholder="P.sh. Biblioteka"
        autoComplete="off"
      />

      <div className="meeting-picker__actions">
        <button
          className="button"
          data-testid="confirm-meeting"
          type="button"
          onClick={konfirmoVendtakimin}
          disabled={dukeRuajtur}
        >
          {udhetimId ? (dukeRuajtur ? "Po ruhet…" : "Konfirmo dhe dërgo te udhëtari") : "Konfirmo në telefon"}
        </button>
        <button
          className="button button--outline"
          data-testid="locate-me"
          type="button"
          onClick={lexoVendndodhjen}
          disabled={gjendja === "loading"}
        >
          Përdor vendndodhjen time
        </button>
      </div>

      <p className="meeting-picker__confirmed">
        Vendtakimi i konfirmuar:{" "}
        <strong data-testid="confirmed-meeting">
          {vendtakimi || "Asnjë ende"}
        </strong>
      </p>
      {udhetimId && mesazhiRuajtjes && (
        <p className="meeting-picker__message" role="status">{mesazhiRuajtjes}</p>
      )}
      <p
        className="meeting-picker__message meeting-picker__message--error"
        data-testid="meeting-error"
        role="alert"
        aria-live="assertive"
      >
        {gabimiTekstit}
      </p>
      <p
        className="meeting-picker__message"
        data-testid="location-status"
        data-state={gjendja}
        role="status"
        aria-live="polite"
      >
        {mesazhi}
      </p>
      <p className="meeting-picker__accuracy" data-testid="location-accuracy">
        {saktesia ? `Saktësia: ${saktesia}` : ""}
      </p>
    </section>
  );
}
