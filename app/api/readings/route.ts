import { NextResponse } from "next/server";
import { getDataAdapter } from "@/lib/adapters/readings";
import type { ApiResponse, ReadingSummary } from "@/lib/types";

// Seeded sample readings as list rows. No audio is involved anywhere in this route.
export const dynamic = "force-static";

export async function GET() {
  const data = getDataAdapter();
  const body: ApiResponse<ReadingSummary[]> = { ok: true, data: await data.listReadings(), mode: data.mode };
  return NextResponse.json(body);
}
