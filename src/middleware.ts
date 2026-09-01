import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import {
  decodeSessionToken,
  getDevelopmentSession,
  isSessionActive,
  SESSION_COOKIE_NAME,
  type Role,
} from "@/lib/auth/session";

const intlMiddleware = createMiddleware(routing);

function rolesForPath(pathname: string): readonly Role[] | null {
  const localPath = pathname.replace(/^\/(?:ar|en)(?=\/|$)/u, "");
  if (/^\/patient(?:\/|$)/u.test(localPath)) return ["patient"];
  if (/^\/reception(?:\/|$)/u.test(localPath)) return ["receptionist", "clinic_admin"];
  if (/^\/doctor\/?$/u.test(localPath)) return ["doctor", "clinic_admin"];
  if (/^\/(?:developer|dev)(?:\/|$)/u.test(localPath)) return ["developer", "platform_admin"];
  return null;
}

function forbiddenResponse(pathname: string) {
  const arabic = pathname.startsWith("/ar/") || pathname === "/ar";
  const lang = arabic ? "ar" : "en";
  const dir = arabic ? "rtl" : "ltr";
  const title = arabic ? "الدخول غير مسموح" : "Access denied";
  const text = arabic
    ? "ليس لديك صلاحية لفتح هذه الصفحة."
    : "You do not have permission to open this page.";
  return new NextResponse(
    `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>403 · Nabda</title></head><body><main><p>403</p><h1>${title}</h1><p>${text}</p></main></body></html>`,
    {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    },
  );
}

export default function middleware(request: NextRequest) {
  const localPath = request.nextUrl.pathname.replace(/^\/(?:ar|en)(?=\/|$)/u, "");
  if (localPath === "/dev/preview") return intlMiddleware(request);
  const allowedRoles = rolesForPath(request.nextUrl.pathname);
  if (allowedRoles) {
    const cookieSession = decodeSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const session = isSessionActive(cookieSession)
      ? cookieSession
      : process.env.NODE_ENV === "production"
        ? null
        : getDevelopmentSession();
    if (!session || !session.roles.some((role) => allowedRoles.includes(role))) {
      return forbiddenResponse(request.nextUrl.pathname);
    }
  }
  return intlMiddleware(request);
}

export const config = { matcher: ["/((?!api|v1|_next|.*\\..*).*)"] };
