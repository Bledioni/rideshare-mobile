import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";

type Profil = { id: string; emri: string; roli: "udhetar" | "shofer" };

export async function profiliIm(): Promise<Profil | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || !/^\d+$/.test(id)) return null;
  const sql = getSql();
  // Çdo hyrje e re fillon si udhëtar. Formulari nuk mund të zgjedhë rol.
  await sql`INSERT INTO profilet (github_id, emri) VALUES (${id}, ${session.user.name ?? "Student"})
    ON CONFLICT (github_id) DO NOTHING`;
  const rows = await sql`SELECT github_id AS id, emri, roli FROM profilet WHERE github_id = ${id}`;
  return rows[0] as Profil;
}

export async function ndryshoOren(id: string, ora: string) {
  const p = await profiliIm();
  if (!p) return "hyr";
  if (p.roli !== "shofer") return "ndaluar";
  if (!/^[123]$/.test(id) || !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(ora)) return "fushe";
  const sql = getSql();
  // Pronari vjen nga sesioni; jo nga një fushë e formularit.
  const rows = await sql`UPDATE udhetimet SET ora = ${ora}
    WHERE id = ${id} AND shofer_id = ${p.id}
      AND EXISTS (SELECT 1 FROM profilet WHERE github_id = ${p.id} AND roli = 'shofer')
    RETURNING id`;
  return rows.length === 1 ? "ruajtur" : "ndaluar";
}

export type FushatEUdhetimit = {
  nisja: string;
  destinacioni: string;
  ora: string;
  vendtakimi: string;
  vende: number;
};

/** Validimi bëhet në server; formulari mund të anashkalohet. */
export function validoUdhetimin(f: FormData): FushatEUdhetimit | null {
  const tekst = (k: string) => String(f.get(k) ?? "").trim();
  const nisja = tekst("nisja");
  const destinacioni = tekst("destinacioni");
  const ora = tekst("ora");
  const vendtakimi = tekst("vendtakimi");
  const vende = Number(tekst("vende"));
  const okTekst = (s: string) => s.length >= 2 && s.length <= 60;
  if (!okTekst(nisja) || !okTekst(destinacioni) || !okTekst(vendtakimi)) return null;
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(ora)) return null;
  if (!Number.isInteger(vende) || vende < 1 || vende > 8) return null;
  return { nisja, destinacioni, ora, vendtakimi, vende };
}

/** Shoferi krijon një udhëtim të ri. Pronari vjen nga sesioni, jo nga formulari. */
export async function krijoUdhetimin(f: FormData): Promise<{ rezultati: string; id?: string }> {
  const p = await profiliIm();
  if (!p) return { rezultati: "hyr" };
  if (p.roli !== "shofer") return { rezultati: "ndaluar" };
  const u = validoUdhetimin(f);
  if (!u) return { rezultati: "fushe_udhetimi" };
  const sql = getSql();
  // ID-të janë tekst numerik; merret numri i radhës. Nëse dy shoferë krijojnë njëkohësisht,
  // çelësi primar e refuzon të dytin dhe provojmë edhe një herë.
  for (let prova = 0; prova < 3; prova++) {
    try {
      const rows = await sql`
        INSERT INTO udhetimet (id, nisja, destinacioni, ora, vendtakimi, vende, shofer_id)
        SELECT (COALESCE(MAX(id::int) FILTER (WHERE id ~ '^[0-9]+$'), 0) + 1)::text,
               ${u.nisja}, ${u.destinacioni}, ${u.ora}, ${u.vendtakimi}, ${u.vende}, ${p.id}
        FROM udhetimet
        RETURNING id`;
      return { rezultati: "krijuar", id: String(rows[0].id) };
    } catch (e) {
      if ((e as { code?: string }).code !== "23505" || prova === 2) throw e;
    }
  }
  return { rezultati: "databaza" };
}
