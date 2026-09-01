import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  encodeSessionToken,
  getSession,
  renewSession,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/session";

export async function POST() {
  const current = await getSession();
  const renewed = current ? renewSession(current) : null;
  if (!renewed) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, encodeSessionToken(renewed), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return NextResponse.json({ session: renewed }, { headers: { "Cache-Control": "no-store" } });
}
