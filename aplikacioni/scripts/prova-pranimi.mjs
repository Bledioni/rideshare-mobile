// Java 10 · prova e serverit: i njëjti pranim dy herë nuk e ul numrin përsëri,
// dhe vendet nuk bëhen negative.
// Ekzekuto pas schema-java10.sql:  node --env-file=.env scripts/prova-pranimi.mjs
// Krijon vetëm rreshta fiktivë me ID "PROVA-J10-*" dhe i fshin në fund.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const SHOFER = "PROVA-J10-SHOFER", U1 = "PROVA-J10-U1", U2 = "PROVA-J10-U2", UDH = "PROVA-J10";
let deshtime = 0;
const prit = (emri, marre, pritur) => {
  const ok = marre === pritur;
  if (!ok) deshtime++;
  console.log(`${ok ? "✔" : "✘"} ${emri}: ${marre}${ok ? "" : ` (pritej ${pritur})`}`);
};

async function pastro() {
  await sql`DELETE FROM udhetimet WHERE id = ${UDH}`;
  await sql`DELETE FROM profilet WHERE github_id IN (${SHOFER}, ${U1}, ${U2})`;
}

try {
  await pastro();
  await sql`INSERT INTO profilet (github_id, emri, roli) VALUES
    (${SHOFER}, 'Shofer prove', 'shofer'), (${U1}, 'Udhëtar 1', 'udhetar'), (${U2}, 'Udhëtar 2', 'udhetar')`;
  await sql`INSERT INTO udhetimet (id, nisja, destinacioni, ora, vendtakimi, vende, shofer_id)
    VALUES (${UDH}, 'Prova', 'AAB', '08:15', 'Prova', 1, ${SHOFER})`;
  const [k1] = await sql`INSERT INTO kerkesat (udhetim_id, udhetar_id) VALUES (${UDH}, ${U1}) RETURNING id`;
  const [k2] = await sql`INSERT INTO kerkesat (udhetim_id, udhetar_id) VALUES (${UDH}, ${U2}) RETURNING id`;
  const prano = async (id, shofer = SHOFER) =>
    (await sql`SELECT prano_kerkesen(${id}::bigint, ${shofer}) AS r`)[0].r;
  const vende = async () => (await sql`SELECT vende FROM udhetimet WHERE id = ${UDH}`)[0].vende;

  prit("Udhëtari nuk mund të pranojë", await prano(k1.id, U1), "ndaluar");
  prit("Pranimi i parë", await prano(k1.id), "pranuar");
  prit("Vendet pas pranimit", await vende(), 0);
  prit("I njëjti pranim përsëri", await prano(k1.id), "tashme_pranuar");
  prit("Vendet pas përsëritjes", await vende(), 0);
  prit("Kërkesa e dytë me 0 vende", await prano(k2.id), "pa_vende");
  prit("Vendet nuk bëhen negative", await vende(), 0);
} finally {
  await pastro();
}
console.log(deshtime === 0 ? "\nTë gjitha provat kaluan." : `\n${deshtime} prova dështuan.`);
process.exit(deshtime === 0 ? 0 : 1);
