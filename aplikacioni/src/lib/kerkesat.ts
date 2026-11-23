import "server-only";
import { getSql } from "./db";

export type StatusiKerkeses = "ne_pritje" | "pranuar";

export type GjendjaUdhetimit = {
  udhetim: {
    id: string;
    nisja: string;
    destinacioni: string;
    ora: string;
    vendtakimi: string;
    vende: number;
    shoferi: string | null;
  };
  // Si e sheh ky sesion udhëtimin. Identiteti vjen nga sesioni, jo nga klienti.
  roli: "shofer" | "udhetar" | "mysafir";
  kerkesaIme: { id: string; statusi: StatusiKerkeses } | null;
  kerkesat: { id: string; udhetari: string; statusi: StatusiKerkeses }[];
  lexuarMe: string;
};

export function idEVlefshme(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 128 && id.trim() === id;
}

/** Leximi nuk ndryshon asgjë. Shoferi sheh kërkesat e udhëtimit të vet; udhëtari vetëm të vetën. */
export async function lexoGjendjen(
  udhetimId: string,
  githubId: string | null,
): Promise<GjendjaUdhetimit | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.nisja, u.destinacioni, u.ora, u.vendtakimi, u.vende, u.shofer_id, p.emri AS shoferi
    FROM udhetimet u LEFT JOIN profilet p ON p.github_id = u.shofer_id
    WHERE u.id = ${udhetimId}
  `;
  const u = rows[0];
  if (!u) return null;

  const gjendja: GjendjaUdhetimit = {
    udhetim: {
      id: String(u.id),
      nisja: u.nisja,
      destinacioni: u.destinacioni,
      ora: u.ora,
      vendtakimi: u.vendtakimi,
      vende: Number(u.vende),
      shoferi: u.shoferi ?? null,
    },
    roli: "mysafir",
    kerkesaIme: null,
    kerkesat: [],
    lexuarMe: new Date().toISOString(),
  };
  if (!githubId) return gjendja;

  if (u.shofer_id === githubId) {
    gjendja.roli = "shofer";
    const kerkesat = await sql`
      SELECT k.id, k.statusi, COALESCE(p.emri, 'Udhëtar') AS udhetari
      FROM kerkesat k LEFT JOIN profilet p ON p.github_id = k.udhetar_id
      WHERE k.udhetim_id = ${udhetimId}
      ORDER BY k.krijuar_me, k.id
    `;
    gjendja.kerkesat = kerkesat.map((k) => ({
      id: String(k.id),
      udhetari: k.udhetari,
      statusi: k.statusi,
    }));
    return gjendja;
  }

  gjendja.roli = "udhetar";
  const imja = await sql`
    SELECT id, statusi FROM kerkesat
    WHERE udhetim_id = ${udhetimId} AND udhetar_id = ${githubId}
  `;
  if (imja[0]) gjendja.kerkesaIme = { id: String(imja[0].id), statusi: imja[0].statusi };
  return gjendja;
}

export type RezultatiKerkeses = "derguar" | "ekziston" | "pa_vende" | "ndaluar" | "nuk_u_gjet";

/** Udhëtari dërgon kërkesë. E njëjta kërkesë e përsëritur nuk krijon kopje. */
export async function dergoKerkesen(udhetimId: string, githubId: string): Promise<RezultatiKerkeses> {
  const sql = getSql();
  const udh = await sql`SELECT shofer_id, vende FROM udhetimet WHERE id = ${udhetimId}`;
  if (!udh[0]) return "nuk_u_gjet";
  if (udh[0].shofer_id === githubId) return "ndaluar";
  if (Number(udh[0].vende) <= 0) return "pa_vende";

  const rows = await sql`
    INSERT INTO kerkesat (udhetim_id, udhetar_id)
    VALUES (${udhetimId}, ${githubId})
    ON CONFLICT (udhetim_id, udhetar_id) DO NOTHING
    RETURNING id
  `;
  return rows.length === 1 ? "derguar" : "ekziston";
}

export type RezultatiPranimit = "pranuar" | "tashme_pranuar" | "pa_vende" | "ndaluar" | "nuk_u_gjet";

/** Pranimi bëhet në databazë (funksioni prano_kerkesen) që statusi dhe vendet të ruhen së bashku. */
export async function pranoKerkesen(kerkeseId: string, shoferId: string): Promise<RezultatiPranimit> {
  if (!/^\d+$/.test(kerkeseId)) return "nuk_u_gjet";
  const sql = getSql();
  const rows = await sql`SELECT prano_kerkesen(${kerkeseId}::bigint, ${shoferId}) AS rezultati`;
  return rows[0].rezultati as RezultatiPranimit;
}

export type UdhetimiIm = {
  id: string;
  nisja: string;
  destinacioni: string;
  ora: string;
  vende: number;
  ne_pritje: number;
};

/** Udhëtimet ku shoferi i sesionit është pronar, me numrin e kërkesave në pritje. */
export async function lexoUdhetimetEMia(shoferId: string): Promise<UdhetimiIm[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.nisja, u.destinacioni, u.ora, u.vende,
      COUNT(k.id) FILTER (WHERE k.statusi = 'ne_pritje')::int AS ne_pritje
    FROM udhetimet u LEFT JOIN kerkesat k ON k.udhetim_id = u.id
    WHERE u.shofer_id = ${shoferId}
    GROUP BY u.id ORDER BY u.ora, u.id
  `;
  return rows as UdhetimiIm[];
}

export const VENDTAKIMI_MAX = 100;

/** Vetëm shoferi pronar (nga sesioni) e ndryshon vendtakimin e udhëtimit të vet. */
export async function ndryshoVendtakimin(
  udhetimId: string,
  shoferId: string,
  vendtakimi: string,
): Promise<"ruajtur" | "ndaluar" | "fushe"> {
  const v = vendtakimi.trim();
  if (!v || v.length > VENDTAKIMI_MAX) return "fushe";
  const sql = getSql();
  const rows = await sql`
    UPDATE udhetimet SET vendtakimi = ${v}
    WHERE id = ${udhetimId} AND shofer_id = ${shoferId}
    RETURNING id
  `;
  return rows.length === 1 ? "ruajtur" : "ndaluar";
}

export type Njoftim = {
  id: string; // unik për llojin + kërkesën
  lloji: "kerkese_e_re" | "kerkese_pranuar";
  udhetimId: string;
  nisja: string;
  destinacioni: string;
  ora: string;
  udhetari?: string;
  shoferi?: string;
  koha: string;
};

/**
 * Njoftimet për sesionin aktual:
 * - shoferi: kërkesat në pritje te udhëtimet e veta;
 * - udhëtari: kërkesat e veta që u pranuan.
 * Klienti mban mend cilat i ka shfaqur; serveri vetëm lexon.
 */
export async function lexoNjoftimet(githubId: string): Promise<Njoftim[]> {
  const sql = getSql();
  const [teReja, tePranuara] = await Promise.all([
    sql`
      SELECT k.id, k.udhetim_id, u.nisja, u.destinacioni, u.ora, k.krijuar_me,
        COALESCE(p.emri, 'Udhëtar') AS udhetari
      FROM kerkesat k
      JOIN udhetimet u ON u.id = k.udhetim_id
      LEFT JOIN profilet p ON p.github_id = k.udhetar_id
      WHERE u.shofer_id = ${githubId} AND k.statusi = 'ne_pritje'
      ORDER BY k.krijuar_me DESC LIMIT 20
    `,
    sql`
      SELECT k.id, k.udhetim_id, u.nisja, u.destinacioni, u.ora, k.ndryshuar_me,
        COALESCE(p.emri, 'Shoferi') AS shoferi
      FROM kerkesat k
      JOIN udhetimet u ON u.id = k.udhetim_id
      LEFT JOIN profilet p ON p.github_id = u.shofer_id
      WHERE k.udhetar_id = ${githubId} AND k.statusi = 'pranuar'
      ORDER BY k.ndryshuar_me DESC LIMIT 20
    `,
  ]);
  return [
    ...teReja.map((k): Njoftim => ({
      id: `kerkese-${k.id}`,
      lloji: "kerkese_e_re",
      udhetimId: String(k.udhetim_id),
      nisja: k.nisja,
      destinacioni: k.destinacioni,
      ora: k.ora,
      udhetari: k.udhetari,
      koha: new Date(k.krijuar_me).toISOString(),
    })),
    ...tePranuara.map((k): Njoftim => ({
      id: `pranuar-${k.id}`,
      lloji: "kerkese_pranuar",
      udhetimId: String(k.udhetim_id),
      nisja: k.nisja,
      destinacioni: k.destinacioni,
      ora: k.ora,
      shoferi: k.shoferi,
      koha: new Date(k.ndryshuar_me).toISOString(),
    })),
  ];
}
