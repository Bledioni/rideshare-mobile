import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { lexoNjoftimet } from "@/lib/kerkesat";

export const dynamic = "force-dynamic";

// Njoftime personale: asnjë cache e përbashkët.
const paCache = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const githubId = session?.user?.id;
    if (!githubId || !/^\d+$/.test(githubId)) {
      return Response.json({ error: "Hyr me GitHub." }, { status: 401, headers: paCache });
    }
    const njoftimet = await lexoNjoftimet(githubId);
    return Response.json({ perdoruesi: githubId, njoftimet, lexuarMe: new Date().toISOString() }, { headers: paCache });
  } catch (error) {
    console.error("Njoftimet nuk u lexuan.", error);
    return Response.json({ error: "Njoftimet nuk mund të lexohen tani." }, { status: 503, headers: paCache });
  }
}
