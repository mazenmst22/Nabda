import { NextResponse } from "next/server";
import { queueResponse, updateReceptionQueue } from "@/lib/reception/data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  const input = (await request.json()) as {
    state?: "waiting" | "called" | "in_room" | "done" | "skipped";
  };
  if (!input.state) return NextResponse.json({ detail: "state is required" }, { status: 422 });
  const result = updateReceptionQueue(
    entryId,
    input.state,
    Number(request.headers.get("If-Match")),
  );
  if (result.kind === "missing")
    return NextResponse.json({ code: "NOT_AUTHORIZED", detail: "Access denied" }, { status: 403 });
  if (result.kind === "conflict")
    return NextResponse.json(
      {
        type: "https://nabda.health/errors/version-conflict",
        title: "Queue changed",
        status: 409,
        code: "VERSION_CONFLICT",
        detail: "This queue entry changed. Reload the board before trying again.",
        correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
      },
      { status: 409 },
    );
  return NextResponse.json(queueResponse(result.entry));
}
