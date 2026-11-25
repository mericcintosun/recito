import { NextResponse } from "next/server";
import { getDataAdapter } from "@/lib/adapters/readings";
import type { ApiResponse, Passage } from "@/lib/types";

// Seeded passages. Reads nothing from the request, so it is built once at deploy time.
export const dynamic = "force-static";

export async function GET() {
  const data = getDataAdapter();
  const body: ApiResponse<Passage[]> = { ok: true, data: await data.listPassages(), mode: data.mode };
  return NextResponse.json(body);
}
