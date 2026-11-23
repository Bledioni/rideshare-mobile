import type { NextRequest } from "next/server";
import { idEVlefshme, ndryshoVendtakimin, VENDTAKIMI_MAX } from "@/lib/kerkesat";
import { profiliIm } from "@/lib/lejet";

const paCache = { "Cache-Control": "no-store" };

// Shoferi pronar ndryshon vendtakimin. Udhëtari e merr me leximin e radhës (çdo 5 sekonda).
export async function POST(req: NextRequest, ctx: RouteContext<"/api/udhetimet/[id]/vendtakimi">) {
  const { id } = await ctx.params;
  if (!idEVlefshme(id)) {
    return Response.json({ error: "Udhëtimi nuk është i vlefshëm." }, { status: 400, headers: paCache });
  }
  const body = await req.json().catch(() => null);
  const vendtakimi = typeof body?.vendtakimi === "string" ? body.vendtakimi : "";
  try {
    const profili = await profiliIm();
    if (!profili) {
      return Response.json({ error: "Hyr me GitHub." }, { status: 401, headers: paCache });
    }
    const rezultati = await ndryshoVendtakimin(id, profili.id, vendtakimi);
    if (rezultati === "fushe") {
      return Response.json(
        { error: `Shkruaj vendtakimin (1–${VENDTAKIMI_MAX} shkronja).` },
        { status: 400, headers: paCache },
      );
    }
    if (rezultati === "ndaluar") {
      return Response.json(
        { error: "Vetëm shoferi pronar mund ta ndryshojë vendtakimin." },
        { status: 403, headers: paCache },
      );
    }
    return Response.json(
      { vendtakimi: vendtakimi.trim(), mesazhi: "Vendtakimi u ruajt. Udhëtari e sheh brenda 5 sekondash." },
      { headers: paCache },
    );
  } catch (error) {
    console.error("Vendtakimi nuk u ruajt.", error);
    return Response.json({ error: "Vendtakimi nuk u ruajt. Provo përsëri." }, { status: 503, headers: paCache });
  }
}
