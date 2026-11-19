import "server-only";
import { getSql } from "./db";

export type StatusiKerkeses = "ne_pritje" | "pranuar";

export type GjendjaUdhetimit = {
  udhetim: {
    id: string;
    nisja: string;
    destinacioni: string;
    ora: string;
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
    SELECT u.id, u.nisja, u.destinacioni, u.ora, u.vende, u.shofer_id, p.emri AS shoferi
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
