import { NextResponse } from "next/server";
import { developerAdminStore } from "@/lib/developer/admin-store";
import { developerGuard } from "@/lib/developer/http";

export async function GET() {
  const forbidden = await developerGuard();
  if (forbidden) return forbidden;
  return NextResponse.json(developerAdminStore().providers);
}
