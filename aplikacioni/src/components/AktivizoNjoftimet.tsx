"use client";

import { useEffect, useState } from "react";

/** Leja e shfletuesit për njoftime kur skeda është në sfond. */
export function AktivizoNjoftimet() {
  const [leja, setLeja] = useState<NotificationPermission | "pa_mbeshtetje" | null>(null);

  useEffect(() => {
    setLeja("Notification" in window ? Notification.permission : "pa_mbeshtetje");
  }, []);

  if (leja === null || leja === "pa_mbeshtetje") return null;
  if (leja === "granted") {
    return <p className="muted small">🔔 Njoftimet e shfletuesit janë aktive.</p>;
  }
  if (leja === "denied") {
    return <p className="muted small">Njoftimet e shfletuesit janë bllokuar. Do t’i shohësh brenda faqes.</p>;
  }
  return (
    <button
      type="button"
      className="button button--ghost button--sm"
      onClick={async () => setLeja(await Notification.requestPermission())}
    >
      🔔 Aktivizo njoftimet e shfletuesit
    </button>
  );
}
