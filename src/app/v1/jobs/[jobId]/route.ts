import { NextResponse } from "next/server";
import { getAuthoritativeJob } from "@/lib/doctor/mock-clinical-store";

export async function GET(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getAuthoritativeJob(jobId);
  if (!job) return NextResponse.json({ detail: "Job not found." }, { status: 404 });
  return NextResponse.json(job);
}
