import { NextResponse } from "next/server";
import { developerAdminStore, resetDeveloperAdminStore } from "@/lib/developer/admin-store";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const store = developerAdminStore();
  return NextResponse.json({
    settingsVersion: store.settings.version,
    promptVersions: store.prompts.length,
    providerVersions: Object.fromEntries(
      store.providers.map((provider) => [provider.id, provider.version]),
    ),
  });
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  resetDeveloperAdminStore();
  return new NextResponse(null, { status: 204 });
}
