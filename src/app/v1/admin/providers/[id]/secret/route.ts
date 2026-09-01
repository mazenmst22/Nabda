import { NextResponse } from "next/server";
import { providerSecret } from "@/lib/developer/admin-store";
import { developerGuard } from "@/lib/developer/http";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await developerGuard("manage", true);
  if (forbidden) return forbidden;
  const { id } = await params;
  const secret = providerSecret(id);
  if (!secret) return new NextResponse(null, { status: 404 });
  return NextResponse.json(
    { providerId: id, value: secret, revealedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
