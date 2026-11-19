import type { NextRequest } from "next/server";
import { pranoKerkesen } from "@/lib/kerkesat";
import { profiliIm } from "@/lib/lejet";

const paCache = { "Cache-Control": "no-store" };
const mesazhet = {
  pranuar: "Pranimi u ruajt.",
  tashme_pranuar: "Kërkesa ishte pranuar më parë. Vendet nuk ndryshuan.",
  pa_vende: "Nuk ka vende të lira. Kërkesa nuk u pranua.",
  ndaluar: "Vetëm shoferi pronar mund ta pranojë këtë kërkesë.",
  nuk_u_gjet: "Kërkesa nuk u gjet.",
} as const;

// Shoferi pronar njihet nga sesioni; rregulli "vetëm një herë" është në databazë.
export async function POST(_req: NextRequest, ctx: RouteContext<"/api/kerkesat/[id]/prano">) {
  const { id } = await ctx.params;
  try {
    const profili = await profiliIm();
    if (!profili) {
      return Response.json({ error: "Hyr me GitHub." }, { status: 401, headers: paCache });
    }
    const rezultati = await pranoKerkesen(id, profili.id);
    const status = rezultati === "pranuar" || rezultati === "tashme_pranuar" ? 200
      : rezultati === "nuk_u_gjet" ? 404
      : rezultati === "ndaluar" ? 403 : 409;
    return Response.json({ rezultati, mesazhi: mesazhet[rezultati] }, { status, headers: paCache });
  } catch (error) {
    console.error("Pranimi nuk u ruajt.", error);
    return Response.json({ error: "Pranimi nuk u ruajt. Provo përsëri." }, { status: 503, headers: paCache });
  }
}
