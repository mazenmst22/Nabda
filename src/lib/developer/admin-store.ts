import type {
  AdminAudit,
  AdminFlag,
  AdminHealth,
  AdminPrompt,
  AdminProvider,
  AdminSettings,
} from "@/lib/schemas";
import {
  adminFlagFixtures,
  adminHealthFixture,
  adminPromptFixtures,
  adminProviderFixtures,
  adminSettingsFixture,
} from "@/mocks/fixtures";

type DeveloperAdminStore = {
  settings: AdminSettings;
  providers: AdminProvider[];
  flags: AdminFlag[];
  prompts: AdminPrompt[];
  health: AdminHealth;
};

declare global {
  var __nabdaDeveloperAdminStore: DeveloperAdminStore | undefined;
  var __nabdaDeveloperAuditRows: AdminAudit[] | undefined;
}

const historicalPrompts: AdminPrompt[] = [
  {
    id: "prompt-prescription-v1",
    key: "prescription-extraction",
    version: 1,
    template:
      "Extract medication names and doses exactly as spoken. Return only the contract JSON.",
    createdAt: "2026-07-03T08:00:00Z",
    createdBy: "developer-youssef",
  },
  {
    id: "prompt-prescription-v2",
    key: "prescription-extraction",
    version: 2,
    template:
      "Extract only clinician-stated medications. Preserve rawText. Return only the contract JSON.",
    createdAt: "2026-08-02T08:00:00Z",
    createdBy: "developer-nadia",
  },
];

function makeStore(): DeveloperAdminStore {
  return {
    settings: structuredClone(adminSettingsFixture),
    providers: structuredClone(adminProviderFixtures),
    flags: structuredClone(adminFlagFixtures),
    prompts: [...historicalPrompts, ...structuredClone(adminPromptFixtures)],
    health: structuredClone(adminHealthFixture),
  };
}

export function developerAdminStore() {
  globalThis.__nabdaDeveloperAdminStore ??= makeStore();
  return globalThis.__nabdaDeveloperAdminStore;
}

export function resetDeveloperAdminStore() {
  globalThis.__nabdaDeveloperAdminStore = makeStore();
}

export function updateAdminSettings(version: number, input: Partial<AdminSettings>) {
  const store = developerAdminStore();
  if (store.settings.version !== version) return undefined;
  store.settings = { ...store.settings, ...input, version: version + 1 };
  return store.settings;
}

export function updateAdminProvider(id: string, version: number, input: Partial<AdminProvider>) {
  const store = developerAdminStore();
  const index = store.providers.findIndex((provider) => provider.id === id);
  const current = store.providers[index];
  if (!current || current.version !== version) return undefined;
  const next = { ...current, ...input, id: current.id, kind: current.kind, version: version + 1 };
  store.providers[index] = next;
  return next;
}

export function updateAdminFlag(key: string, version: number, enabled: boolean) {
  const store = developerAdminStore();
  const index = store.flags.findIndex((flag) => flag.key === key);
  const current = store.flags[index];
  if (!current || current.version !== version) return undefined;
  const next = { ...current, enabled, version: version + 1 };
  store.flags[index] = next;
  return next;
}

export function publishPromptVersion(key: string, template: string): AdminPrompt {
  const store = developerAdminStore();
  const version =
    Math.max(
      0,
      ...store.prompts.filter((prompt) => prompt.key === key).map((prompt) => prompt.version),
    ) + 1;
  const prompt: AdminPrompt = {
    id: `prompt-${key}-v${version}`,
    key,
    version,
    template,
    createdAt: new Date().toISOString(),
    createdBy: "developer-youssef",
  };
  store.prompts.push(prompt);
  return prompt;
}

export function providerSecret(id: string) {
  const secrets: Record<string, string> = {
    "provider-stt": "stt_live_9df2a8c61f3b4e77",
    "provider-llm": "llm_live_f98c1d06a5324bde",
  };
  return secrets[id];
}

function auditUuid(index: number) {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
}

export function developerAuditRows() {
  globalThis.__nabdaDeveloperAuditRows ??= Array.from({ length: 10_000 }, (_, index) => {
    const actors = ["developer-youssef", "developer-nadia", "platform-nour", "clinic-salma"];
    const entities = ["provider", "feature_flag", "prompt", "tenant_settings"];
    const actions = ["updated", "disabled", "published", "viewed"];
    const entity = entities[index % entities.length]!;
    return {
      id: `audit-${String(index + 1).padStart(5, "0")}`,
      actor: actors[index % actors.length]!,
      action: `${entity}.${actions[index % actions.length]}`,
      entity,
      entityId: `${entity}-${(index % 37) + 1}`,
      occurredAt: new Date(Date.parse("2026-08-30T10:00:00Z") - index * 60_000).toISOString(),
      correlationId: auditUuid(index + 1),
      reversible: index % 5 !== 0,
    } satisfies AdminAudit;
  });
  return globalThis.__nabdaDeveloperAuditRows;
}
