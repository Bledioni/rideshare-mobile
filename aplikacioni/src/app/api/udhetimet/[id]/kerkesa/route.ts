import type { NextRequest } from "next/server";
import { idEVlefshme, dergoKerkesen } from "@/lib/kerkesat";
import { profiliIm } from "@/lib/lejet";

const paCache = { "Cache-Control": "no-store" };
const mesazhet = {
  derguar: "Kërkesa u dërgua.",
  ekziston: "Kërkesa ekziston tashmë.",
  pa_vende: "Nuk ka vende të lira.",
  ndaluar: "Nuk mund të kërkosh vend në udhëtimin tënd.",
  nuk_u_gjet: "Udhëtimi nuk u gjet.",
} as const;

// Udhëtari merret nga sesioni; klienti dërgon vetëm ID-në e udhëtimit (në URL).
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/udhetimet/[id]/kerkesa">) {
  const { id } = await ctx.params;
  if (!idEVlefshme(id)) {
    return Response.json({ error: "Udhëtimi nuk është i vlefshëm." }, { status: 400, headers: paCache });
  }
  try {
    const profili = await profiliIm();
    if (!profili) {
      return Response.json({ error: "Hyr me GitHub për të kërkuar vend." }, { status: 401, headers: paCache });
    }
    const rezultati = await dergoKerkesen(id, profili.id);
    const status = rezultati === "derguar" ? 201
      : rezultati === "ekziston" ? 200
      : rezultati === "nuk_u_gjet" ? 404
      : rezultati === "ndaluar" ? 403 : 409;
    return Response.json({ rezultati, mesazhi: mesazhet[rezultati] }, { status, headers: paCache });
  } catch (error) {
    console.error("Kërkesa nuk u ruajt.", error);
    return Response.json({ error: "Kërkesa nuk u ruajt. Provo përsëri." }, { status: 503, headers: paCache });
  }
}
