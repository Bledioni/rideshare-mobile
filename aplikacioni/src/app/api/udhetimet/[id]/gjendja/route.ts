import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { idEVlefshme, lexoGjendjen } from "@/lib/kerkesat";

export const dynamic = "force-dynamic";

// Gjendja personale: mos e ruaj në cache dhe mos e ndaj me një sesion tjetër.
const paCache = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/udhetimet/[id]/gjendja">) {
  const { id } = await ctx.params;
  if (!idEVlefshme(id)) {
    return Response.json({ error: "Udhëtimi nuk është i vlefshëm." }, { status: 400, headers: paCache });
  }
  try {
    const session = await getServerSession(authOptions);
    const githubId = session?.user?.id && /^\d+$/.test(session.user.id) ? session.user.id : null;
    const gjendja = await lexoGjendjen(id, githubId);
    if (!gjendja) {
      return Response.json({ error: "Udhëtimi nuk u gjet." }, { status: 404, headers: paCache });
    }
    return Response.json(gjendja, { headers: paCache });
  } catch (error) {
    console.error("Gjendja e udhëtimit nuk u lexua.", error);
    return Response.json({ error: "Gjendja nuk mund të lexohet tani." }, { status: 503, headers: paCache });
  }
}
