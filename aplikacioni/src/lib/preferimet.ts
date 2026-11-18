import "server-only";
import { getSql } from "./db";

export async function lexoPreferimet(githubId: string): Promise<string[]> {
  if (!/^\d+$/.test(githubId)) {
    throw new Error("ID-ja e përdoruesit nuk është e vlefshme.");
  }

  const sql = getSql();
  const rows = await sql`
    SELECT udhetim_id
    FROM preferimet
    WHERE github_id = ${githubId}
    ORDER BY krijuar_me, udhetim_id
  `;

  return rows.map((row) => String(row.udhetim_id));
}

export async function ruajPreferiminNeDatabaze(
  githubId: string,
  udhetimId: string,
): Promise<boolean> {
  if (!/^\d+$/.test(githubId) || !udhetimId.trim() || udhetimId.length > 128) {
    return false;
  }

  const sql = getSql();
  const udhetimet = await sql`
    SELECT id
    FROM udhetimet
    WHERE id = ${udhetimId}
  `;
  if (udhetimet.length === 0) {
    return false;
  }

  await sql`
    INSERT INTO preferimet (github_id, udhetim_id)
    VALUES (${githubId}, ${udhetimId})
    ON CONFLICT (github_id, udhetim_id) DO NOTHING
  `;

  return true;
}
