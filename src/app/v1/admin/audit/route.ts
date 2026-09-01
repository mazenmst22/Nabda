import { NextResponse } from "next/server";
import { developerAuditRows } from "@/lib/developer/admin-store";
import { developerGuard } from "@/lib/developer/http";

export async function GET(request: Request) {
  const forbidden = await developerGuard();
  if (forbidden) return forbidden;
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(10_000, Math.max(1, Number(url.searchParams.get("pageSize") ?? 100)));
  const actor = url.searchParams.get("actor")?.toLocaleLowerCase();
  const entity = url.searchParams.get("entity")?.toLocaleLowerCase();
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const filtered = developerAuditRows().filter(
    (row) =>
      (!actor || row.actor.toLocaleLowerCase().includes(actor)) &&
      (!entity || row.entity.toLocaleLowerCase().includes(entity)) &&
      (!from || row.occurredAt >= `${from}T00:00:00.000Z`) &&
      (!to || row.occurredAt <= `${to}T23:59:59.999Z`),
  );
  const start = (page - 1) * pageSize;
  return NextResponse.json({
    items: filtered.slice(start, start + pageSize),
    page,
    pageSize,
    total: filtered.length,
  });
}
