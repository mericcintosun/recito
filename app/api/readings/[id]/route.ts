import { NextResponse } from "next/server";
import { getDataAdapter } from "@/lib/adapters/readings";
import type { ApiResponse, SampleReading } from "@/lib/types";

// One seeded sample reading (transcript and teacher marks, never audio). Known ids are
// prebuilt; any other id answers 404 with a not_found error.
export const dynamic = "force-static";

export async function generateStaticParams() {
  const readings = await getDataAdapter().listReadings();
  return readings.map((r) => ({ id: r.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = getDataAdapter();
  const reading = await data.getReading(id);
  if (!reading) {
    const body: ApiResponse<SampleReading> = {
      ok: false,
      error: { code: "not_found", message: `No saved reading with the id "${id}".` },
    };
    return NextResponse.json(body, { status: 404 });
  }
  const body: ApiResponse<SampleReading> = { ok: true, data: reading, mode: data.mode };
  return NextResponse.json(body);
}
