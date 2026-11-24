import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/components/result-view";
import { passageById, sampleReadings } from "@/lib/data";
import type { ResultRecord } from "@/lib/flow-session";

export function generateStaticParams() {
  return sampleReadings.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const reading = sampleReadings.find((r) => r.id === id);
  return { title: reading ? `${reading.student}'s running record` : "Running record" };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reading = sampleReadings.find((r) => r.id === id);
  let seeded: ResultRecord | undefined;

  if (reading) {
    const passage = passageById(reading.passageId);
    if (!passage) notFound();
    seeded = {
      student: reading.student,
      title: passage.title,
      text: passage.text,
      words: reading.transcript,
      accepted: [],
      recordedOn: reading.recordedOn,
      producedBy: `Sample reading from the evaluation set (${reading.tests.toLowerCase()}), transcript only`,
      hasAudio: false,
    };
  } else if (!id.startsWith("live-")) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <ResultView id={id} seeded={seeded} />
    </div>
  );
}
