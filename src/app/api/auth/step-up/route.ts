import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  encodeSessionToken,
  getSession,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  stepUpSession,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { prompt?: unknown } | null;
  if (body?.prompt !== "login")
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });

  const current = await getSession();
  const steppedUp = current ? stepUpSession(current) : null;
  if (!steppedUp) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, encodeSessionToken(steppedUp), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return NextResponse.json({ session: steppedUp }, { headers: { "Cache-Control": "no-store" } });
}
