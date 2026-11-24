import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlowProgress } from "@/components/flow-progress";
import { PassageStep } from "@/components/flow/passage-step";
import { RecordStep } from "@/components/flow/record-step";
import { ReviewStep } from "@/components/flow/review-step";
import { FLOW_STEPS, isFlowStep } from "@/lib/flow-session";

export function generateStaticParams() {
  return FLOW_STEPS.map((s) => ({ step: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const { step } = await params;
  const meta = FLOW_STEPS.find((s) => s.slug === step);
  return { title: meta ? meta.label : "Screening" };
}

export default async function ScreenStepPage({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!isFlowStep(step)) notFound();
  const meta = FLOW_STEPS.find((s) => s.slug === step) ?? FLOW_STEPS[0];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-10 md:py-14">
      <FlowProgress current={step} />
      <div className="recito-enter space-y-3">
        <h1 className="text-3xl font-semibold md:text-4xl">{meta.label}</h1>
        <p className="max-w-[68ch] text-lg text-muted-foreground">{meta.ask}</p>
      </div>
      {step === "passage" && <PassageStep />}
      {step === "record" && <RecordStep />}
      {step === "review" && <ReviewStep />}
    </div>
  );
}
