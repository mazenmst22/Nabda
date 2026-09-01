"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  ConfirmDialog,
  Icon,
  Input,
  Ltr,
  Select,
  StatusPill,
  Textarea,
} from "@/components/ui";
import { ApiClient, createApiAction } from "@/lib/api/client";
import { useSession } from "@/lib/auth/session-provider";
import { hasFreshStepUp } from "@/lib/auth/session";
import { StepUpReauthentication } from "@/lib/auth/step-up";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumeralPreference, useNumerals } from "@/lib/i18n/numerals";
import {
  adminFlagListSchema,
  adminFlagSchema,
  adminHealthSchema,
  adminPromptListSchema,
  adminPromptSchema,
  adminProviderListSchema,
  adminProviderSchema,
  adminSettingsSchema,
  type AdminAudit,
  type AdminFlag,
  type AdminHealth,
  type AdminPrompt,
  type AdminProvider,
  type AdminSettings,
} from "@/lib/schemas";

type DestructiveConfirmation = {
  title: string;
  description: string;
  action: string;
  run: () => void;
};

function statusForHealth(status: "healthy" | "degraded" | "unavailable") {
  if (status === "healthy") return "completed" as const;
  if (status === "degraded") return "held" as const;
  return "cancelled" as const;
}

function ProviderSecret({ providerId }: { providerId: string }) {
  const t = useTranslations("admin.developer");
  const { session } = useSession();
  const [secret, setSecret] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const verified = hasFreshStepUp(session);

  useEffect(() => {
    if (!verified) {
      setSecret(null);
      return;
    }
    let active = true;
    void fetch(`/v1/admin/providers/${providerId}/secret`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("secret unavailable");
        const payload = (await response.json()) as { value: string };
        if (active) setSecret(payload.value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [providerId, verified]);

  if (!verified) return <Ltr>••••••••••••••••••••••••</Ltr>;
  if (failed) return <span role="alert">{t("secrets.failed")}</span>;
  if (!secret) return <span aria-busy="true">{t("secrets.loading")}</span>;
  return <Ltr>{secret}</Ltr>;
}

function ProviderConfiguration({
  provider,
  onChange,
  onSave,
  onDisable,
  busy,
}: {
  provider: AdminProvider;
  onChange: (provider: AdminProvider) => void;
  onSave: () => void;
  onDisable: () => void;
  busy: boolean;
}) {
  const t = useTranslations("admin.developer");
  const numerals = useNumerals();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateAndSave() {
    const nextErrors: Record<string, string> = {};
    if (!provider.provider.trim()) nextErrors.provider = t("validation.required");
    if (!provider.model.trim()) nextErrors.model = t("validation.required");
    if (!provider.region.trim()) nextErrors.region = t("validation.required");
    if (provider.timeoutMs < 1000 || provider.timeoutMs > 120_000)
      nextErrors.timeoutMs = t("validation.timeout");
    if (provider.confidenceThreshold < 0 || provider.confidenceThreshold > 1)
      nextErrors.confidenceThreshold = t("validation.confidence");
    if (provider.retentionDays < 0 || provider.retentionDays > 365)
      nextErrors.retentionDays = t("validation.retention");
    const schemaValid = adminProviderSchema.safeParse(provider).success;
    if (!schemaValid && Object.keys(nextErrors).length === 0)
      nextErrors.provider = t("validation.invalidProvider");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSave();
  }

  function field(
    key: "provider" | "model" | "region" | "timeoutMs" | "confidenceThreshold" | "retentionDays",
    label: string,
    type: "text" | "number" = "text",
  ) {
    return (
      <label className="developer-field">
        <span>{label}</span>
        <Input
          type={type}
          min={type === "number" ? 0 : undefined}
          step={key === "confidenceThreshold" ? 0.01 : undefined}
          value={provider[key]}
          aria-invalid={Boolean(errors[key]) || undefined}
          aria-describedby={errors[key] ? `${provider.id}-${key}-error` : undefined}
          onChange={(event) =>
            onChange({
              ...provider,
              [key]: type === "number" ? Number(event.target.value) : event.target.value,
            })
          }
        />
        {errors[key] ? (
          <small id={`${provider.id}-${key}-error`} role="alert">
            {errors[key]}
          </small>
        ) : null}
      </label>
    );
  }

  return (
    <article className="developer-provider-card" data-provider={provider.id}>
      <header>
        <span className="developer-provider-kind">
          <Icon name={provider.kind === "stt" ? "message" : "spark"} size={18} />
          <Ltr>{provider.kind.toUpperCase()}</Ltr>
        </span>
        <div>
          <h3>{provider.provider}</h3>
          <p>
            {provider.kind === "stt"
              ? t("providers.sttDescription")
              : t("providers.llmDescription")}
          </p>
        </div>
        <StatusPill
          status={provider.enabled ? "completed" : "cancelled"}
          label={provider.enabled ? t("enabled") : t("disabled")}
        />
      </header>
      <div className="developer-provider-fields">
        {field("provider", t("providers.provider"))}
        {field("model", t("providers.model"))}
        {field("region", t("providers.region"))}
        {field("timeoutMs", t("providers.timeout"), "number")}
        {field("confidenceThreshold", t("providers.confidence"), "number")}
        {field("retentionDays", t("providers.retention"), "number")}
      </div>
      <div className="developer-secret-row">
        <div>
          <span>{t("secrets.label")}</span>
          <small>{t("secrets.description")}</small>
        </div>
        <code data-provider-secret={provider.id}>
          <ProviderSecret providerId={provider.id} />
        </code>
      </div>
      <footer>
        <Ltr>{t("version", { version: numerals(provider.version) })}</Ltr>
        <div>
          {provider.enabled ? (
            <Button variant="danger" onClick={onDisable}>
              {t("providers.disable")}
            </Button>
          ) : null}
          <Button loading={busy} loadingLabel={t("saving")} onClick={validateAndSave}>
            {t("providers.save")}
          </Button>
        </div>
      </footer>
    </article>
  );
}

function promptDiff(previous: string, current: string) {
  if (previous === current) return null;
  return { previous, current };
}

function PromptVersions({
  prompts,
  onPublished,
  api,
}: {
  prompts: AdminPrompt[];
  onPublished: (prompt: AdminPrompt) => void;
  api: ApiClient;
}) {
  const t = useTranslations("admin.developer");
  const numerals = useNumerals();
  const [selectedVersion, setSelectedVersion] = useState(prompts.at(-1)?.version ?? 1);
  const [template, setTemplate] = useState(prompts.at(-1)?.template ?? "");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const selected = prompts.find((prompt) => prompt.version === selectedVersion) ?? prompts.at(-1)!;
  const index = prompts.findIndex((prompt) => prompt.version === selected.version);
  const previous = index > 0 ? prompts[index - 1] : undefined;
  const diff = previous ? promptDiff(previous.template, selected.template) : null;

  async function publish() {
    if (template.trim().length < 20) {
      setError(t("validation.prompt"));
      return;
    }
    setError("");
    setPublishing(true);
    try {
      const prompt = await api.post(
        "/v1/admin/prompts",
        adminPromptSchema,
        { key: "prescription-extraction", template },
        { action: createApiAction(), retries: 0 },
      );
      onPublished(prompt);
      setSelectedVersion(prompt.version);
      setTemplate(prompt.template);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="developer-prompt-layout">
      <div className="developer-version-list" aria-label={t("prompts.history")}>
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            className={prompt.version === selected.version ? "is-current" : ""}
            aria-pressed={prompt.version === selected.version}
            onClick={() => setSelectedVersion(prompt.version)}
          >
            <Ltr>{t("version", { version: numerals(prompt.version) })}</Ltr>
            <span>{prompt.createdBy}</span>
          </button>
        ))}
      </div>
      <div className="developer-prompt-editor">
        <label htmlFor="developer-prompt-template">{t("prompts.newTemplate")}</label>
        <Textarea
          id="developer-prompt-template"
          value={template}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "developer-prompt-error" : undefined}
          onChange={(event) => setTemplate(event.target.value)}
        />
        {error ? (
          <small id="developer-prompt-error" role="alert">
            {error}
          </small>
        ) : null}
        <Button
          loading={publishing}
          loadingLabel={t("prompts.publishing")}
          onClick={() => void publish()}
        >
          {t("prompts.publish")}
        </Button>
      </div>
      <section className="developer-prompt-diff" aria-labelledby="developer-prompt-diff-title">
        <h3 id="developer-prompt-diff-title">
          {t("prompts.diff", { version: numerals(selected.version) })}
        </h3>
        {diff ? (
          <div>
            <del>{diff.previous}</del>
            <ins>{diff.current}</ins>
          </div>
        ) : (
          <p>{t("prompts.noDiff")}</p>
        )}
      </section>
    </div>
  );
}

type AuditWorkerMessage =
  | { type: "ready"; total: number }
  | { type: "result"; requestId: number; total: number; items: AdminAudit[]; durationMs: number }
  | { type: "error"; detail: string };

function AuditViewer({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("admin.developer");
  const preference = useNumeralPreference();
  const numerals = useNumerals();
  const workerRef = useRef<Worker | null>(null);
  const heartbeatRef = useRef<HTMLElement | null>(null);
  const requestRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(true);
  const [sourceTotal, setSourceTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<AdminAudit[]>([]);
  const [durationMs, setDurationMs] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ actor: "", entity: "", from: "", to: "" });
  const pageSize = 60;

  useEffect(() => {
    const element = heartbeatRef.current;
    let heartbeat = 0;
    let frame = 0;
    const tick = () => {
      heartbeat += 1;
      if (element) element.dataset.mainThreadHeartbeat = String(heartbeat);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const worker = new Worker("/workers/audit-filter.js");
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<AuditWorkerMessage>) => {
      const message = event.data;
      if (message.type === "ready") {
        setSourceTotal(message.total);
        setReady(true);
        return;
      }
      if (message.type === "result" && message.requestId === requestRef.current) {
        setRows(message.items);
        setTotal(message.total);
        setDurationMs(message.durationMs);
        setProcessing(false);
        return;
      }
      if (message.type === "error") {
        setProcessing(false);
      }
    };
    worker.postMessage({ type: "load", url: "/v1/admin/audit?pageSize=10000" });
    return () => worker.terminate();
  }, []);

  useEffect(() => {
    if (!ready || !workerRef.current) return;
    requestRef.current += 1;
    setProcessing(true);
    workerRef.current.postMessage({
      type: "filter",
      requestId: requestRef.current,
      filters,
      page,
      pageSize,
    });
  }, [filters, page, ready]);

  function setFilter(key: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section
      ref={heartbeatRef}
      className="developer-audit-viewer"
      data-audit-source-total={sourceTotal}
      data-worker-state={processing ? "processing" : "complete"}
      data-filter-duration={durationMs.toFixed(2)}
      aria-busy={processing}
    >
      <div className="developer-audit-performance">
        <span>
          <Icon name="code" size={16} />
          {t("audit.worker")}
        </span>
        <span>
          <Ltr>{numerals(sourceTotal)}</Ltr>
          {t("audit.loadedRows")}
        </span>
        <span>
          <Ltr>{numerals(rows.length)}</Ltr>
          {t("audit.renderedRows")}
        </span>
      </div>
      <form className="developer-audit-filters" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>{t("audit.actor")}</span>
          <Input
            value={filters.actor}
            onChange={(event) => setFilter("actor", event.target.value)}
          />
        </label>
        <label>
          <span>{t("audit.entity")}</span>
          <Select
            value={filters.entity}
            onChange={(event) => setFilter("entity", event.target.value)}
          >
            <option value="">{t("audit.allEntities")}</option>
            <option value="provider">{t("audit.entities.provider")}</option>
            <option value="feature_flag">{t("audit.entities.featureFlag")}</option>
            <option value="prompt">{t("audit.entities.prompt")}</option>
            <option value="tenant_settings">{t("audit.entities.tenantSettings")}</option>
          </Select>
        </label>
        <label>
          <span>{t("audit.from")}</span>
          <Input
            type="date"
            value={filters.from}
            onChange={(event) => setFilter("from", event.target.value)}
          />
        </label>
        <label>
          <span>{t("audit.to")}</span>
          <Input
            type="date"
            value={filters.to}
            onChange={(event) => setFilter("to", event.target.value)}
          />
        </label>
      </form>
      <div className="developer-audit-result-count" aria-live="polite">
        {processing ? t("audit.filtering") : t("audit.resultCount", { count: numerals(total) })}
      </div>
      <div className="developer-audit-table-wrap" tabIndex={0} aria-label={t("audit.tableRegion")}>
        <table>
          <caption className="sr-only">{t("audit.table")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("audit.time")}</th>
              <th scope="col">{t("audit.actor")}</th>
              <th scope="col">{t("audit.action")}</th>
              <th scope="col">{t("audit.entity")}</th>
              <th scope="col">{t("audit.reference")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Ltr>
                    {formatDateTime(row.occurredAt, {
                      locale,
                      numerals: preference,
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Ltr>
                </td>
                <td>{row.actor}</td>
                <td>{row.action}</td>
                <td>{row.entity}</td>
                <td>
                  <Ltr>{row.entityId}</Ltr>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="developer-audit-pagination">
        <Button
          variant="ghost"
          disabled={page === 1 || processing}
          onClick={() => setPage((value) => value - 1)}
        >
          {t("audit.previous")}
        </Button>
        <Ltr>{t("audit.page", { page: numerals(page) })}</Ltr>
        <Button
          variant="ghost"
          disabled={page * pageSize >= total || processing}
          onClick={() => setPage((value) => value + 1)}
        >
          {t("audit.next")}
        </Button>
      </footer>
    </section>
  );
}

function HealthDashboard({ health, locale }: { health: AdminHealth; locale: "ar" | "en" }) {
  const t = useTranslations("admin.developer");
  const numerals = useNumerals();
  const preference = useNumeralPreference();
  const services = [
    ["API", health.api],
    [t("health.database"), health.db],
    [t("health.queue"), health.queue],
    [t("health.storage"), health.storage],
  ] as const;
  return (
    <div className="developer-health-dashboard">
      <div className="developer-health-metrics">
        <article>
          <span>{t("health.queueDepth")}</span>
          <strong>
            <Ltr>{numerals(health.metrics.queueDepth)}</Ltr>
          </strong>
          <small>{t("health.jobs")}</small>
        </article>
        <article>
          <span>{t("health.p50", { percentile: numerals(50) })}</span>
          <strong>
            <Ltr>{numerals(health.metrics.jobLatencyMs.p50)}</Ltr>
          </strong>
          <small>ms</small>
        </article>
        <article>
          <span>{t("health.p95", { percentile: numerals(95) })}</span>
          <strong>
            <Ltr>{numerals(health.metrics.jobLatencyMs.p95)}</Ltr>
          </strong>
          <small>ms</small>
        </article>
        <article>
          <span>{t("health.failureRate")}</span>
          <strong>
            <Ltr>{numerals(`${(health.metrics.failureRate * 100).toFixed(1)}%`)}</Ltr>
          </strong>
          <small>{t("health.window")}</small>
        </article>
      </div>
      <div className="developer-service-grid">
        {services.map(([name, status]) => (
          <article key={name}>
            <strong>{name}</strong>
            <StatusPill status={statusForHealth(status)} label={t(`health.statuses.${status}`)} />
          </article>
        ))}
        {health.providers.map((provider) => (
          <article key={provider.id}>
            <strong>
              <Ltr>{provider.id}</Ltr>
            </strong>
            <StatusPill
              status={statusForHealth(provider.status)}
              label={t(`health.statuses.${provider.status}`)}
            />
          </article>
        ))}
      </div>
      <p className="developer-health-sampled">
        <Icon name="clock" size={15} />
        {t("health.sampledAt")}{" "}
        <Ltr>
          {formatDateTime(health.metrics.sampledAt, {
            locale,
            numerals: preference,
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Ltr>
      </p>
    </div>
  );
}

export function DeveloperWorkspace({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("admin.developer");
  const numerals = useNumerals();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [flags, setFlags] = useState<AdminFlag[]>([]);
  const [prompts, setPrompts] = useState<AdminPrompt[]>([]);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [confirmation, setConfirmation] = useState<DestructiveConfirmation | null>(null);
  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "developer-session",
        getClinicId: () => "clinic-maadi",
        getLocale: () => locale,
      }),
    [locale],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.get("/v1/admin/settings", adminSettingsSchema),
      api.get("/v1/admin/providers", adminProviderListSchema),
      api.get("/v1/admin/flags", adminFlagListSchema),
      api.get("/v1/admin/prompts", adminPromptListSchema),
      api.get("/v1/admin/health", adminHealthSchema),
    ]).then(([nextSettings, nextProviders, nextFlags, nextPrompts, nextHealth]) => {
      if (!active) return;
      setSettings(nextSettings);
      setProviders(nextProviders);
      setFlags(nextFlags);
      setPrompts(nextPrompts);
      setHealth(nextHealth);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [api]);

  async function saveSettings() {
    if (!settings) return;
    if (settings.retentionDays < 1 || settings.retentionDays > 365) {
      setSettingsError(t("validation.tenantRetention"));
      return;
    }
    setSettingsError("");
    setBusyKey("settings");
    try {
      const updated = await api.patch(
        "/v1/admin/settings",
        adminSettingsSchema,
        {
          locale: settings.locale,
          timezone: settings.timezone,
          retentionDays: settings.retentionDays,
        },
        { version: settings.version, action: createApiAction(), retries: 0 },
      );
      setSettings(updated);
      setAnnouncement(t("tenant.saved"));
    } finally {
      setBusyKey("");
    }
  }

  async function saveProvider(provider: AdminProvider, enabled = provider.enabled) {
    setBusyKey(provider.id);
    try {
      const updated = await api.patch(
        `/v1/admin/providers/${provider.id}`,
        adminProviderSchema,
        {
          provider: provider.provider,
          model: provider.model,
          region: provider.region,
          timeoutMs: provider.timeoutMs,
          confidenceThreshold: provider.confidenceThreshold,
          retentionDays: provider.retentionDays,
          enabled,
        },
        { version: provider.version, action: createApiAction(), retries: 0 },
      );
      setProviders((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setAnnouncement(t("providers.saved", { provider: updated.provider }));
    } finally {
      setBusyKey("");
    }
  }

  async function updateFlag(flag: AdminFlag, enabled: boolean) {
    setBusyKey(flag.key);
    try {
      const updated = await api.patch(
        `/v1/admin/flags/${flag.key}`,
        adminFlagSchema,
        { enabled },
        { version: flag.version, action: createApiAction(), retries: 0 },
      );
      setFlags((items) => items.map((item) => (item.key === updated.key ? updated : item)));
      setAnnouncement(t("flags.saved", { flag: updated.key }));
    } finally {
      setBusyKey("");
    }
  }

  if (loading || !settings || !health) {
    return (
      <main className="developer-workspace developer-loading" aria-busy="true">
        <span className="ui-spinner" />
        <p>{t("loading")}</p>
      </main>
    );
  }

  return (
    <main className="developer-workspace" id="main-content">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <header className="developer-page-header">
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <span className="developer-environment-mark">
          <Icon name="code" size={18} />
          {t("environment")}
        </span>
      </header>

      <nav className="developer-section-nav" aria-label={t("sections")}>
        <a href={`/${locale}/developer/notifications`}>{t("nav.notifications")}</a>
        {["tenant", "providers", "flags", "prompts", "audit", "health"].map((section) => (
          <a key={section} href={`#developer-${section}`}>
            {t(`nav.${section}`)}
          </a>
        ))}
      </nav>

      <section
        id="developer-tenant"
        className="developer-panel"
        aria-labelledby="developer-tenant-title"
      >
        <header className="developer-panel-heading">
          <div>
            <p className="type-label">{t("tenant.eyebrow")}</p>
            <h2 id="developer-tenant-title">{t("tenant.title")}</h2>
            <p>{t("tenant.description")}</p>
          </div>
          <Ltr>{settings.clinicId}</Ltr>
        </header>
        <div className="developer-tenant-fields">
          <label>
            <span>{t("tenant.locale")}</span>
            <Select
              value={settings.locale}
              onChange={(event) =>
                setSettings({ ...settings, locale: event.target.value as "ar" | "en" })
              }
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
          </label>
          <label>
            <span>{t("tenant.timezone")}</span>
            <Input value={settings.timezone} readOnly dir="ltr" />
          </label>
          <label>
            <span>{t("tenant.retention")}</span>
            <Input
              type="number"
              min={1}
              max={365}
              value={settings.retentionDays}
              aria-invalid={Boolean(settingsError) || undefined}
              aria-describedby={settingsError ? "tenant-retention-error" : undefined}
              onChange={(event) =>
                setSettings({ ...settings, retentionDays: Number(event.target.value) })
              }
            />
            {settingsError ? (
              <small id="tenant-retention-error" role="alert">
                {settingsError}
              </small>
            ) : null}
          </label>
        </div>
        <footer>
          <Ltr>{t("version", { version: numerals(settings.version) })}</Ltr>
          <Button
            loading={busyKey === "settings"}
            loadingLabel={t("saving")}
            onClick={() => void saveSettings()}
          >
            {t("tenant.save")}
          </Button>
        </footer>
      </section>

      <section
        id="developer-providers"
        className="developer-panel"
        aria-labelledby="developer-providers-title"
      >
        <header className="developer-panel-heading">
          <div>
            <p className="type-label">{t("providers.eyebrow")}</p>
            <h2 id="developer-providers-title">{t("providers.title")}</h2>
            <p>{t("providers.description")}</p>
          </div>
          <StepUpReauthentication
            labels={{
              action: t("secrets.reveal"),
              title: t("secrets.stepUpTitle"),
              description: t("secrets.stepUpDescription"),
              verify: t("secrets.verify"),
              verifying: t("secrets.verifying"),
              cancel: t("cancel"),
              close: t("close"),
              failed: t("secrets.failed"),
              verified: t("secrets.verified"),
            }}
          />
        </header>
        <div className="developer-provider-grid">
          {providers.map((provider) => (
            <ProviderConfiguration
              key={provider.id}
              provider={provider}
              busy={busyKey === provider.id}
              onChange={(next) =>
                setProviders((items) => items.map((item) => (item.id === next.id ? next : item)))
              }
              onSave={() => void saveProvider(provider)}
              onDisable={() =>
                setConfirmation({
                  title: t("providers.disableTitle", { provider: provider.provider }),
                  description: t("providers.disableConsequence", { provider: provider.provider }),
                  action: t("providers.confirmDisable"),
                  run: () => void saveProvider(provider, false),
                })
              }
            />
          ))}
        </div>
      </section>

      <section
        id="developer-flags"
        className="developer-panel"
        aria-labelledby="developer-flags-title"
      >
        <header className="developer-panel-heading">
          <div>
            <p className="type-label">{t("flags.eyebrow")}</p>
            <h2 id="developer-flags-title">{t("flags.title")}</h2>
            <p>{t("flags.description")}</p>
          </div>
        </header>
        <div className="developer-flag-list">
          {flags.map((flag) => (
            <article key={flag.key}>
              <div>
                <code>
                  <Ltr>{flag.key}</Ltr>
                </code>
                <small>{t(`flags.copy.${flag.key}`)}</small>
              </div>
              <StatusPill
                status={flag.enabled ? "completed" : "cancelled"}
                label={flag.enabled ? t("enabled") : t("disabled")}
              />
              <Button
                variant={flag.enabled ? "danger" : "secondary"}
                loading={busyKey === flag.key}
                loadingLabel={t("saving")}
                onClick={() =>
                  flag.enabled
                    ? setConfirmation({
                        title: t("flags.disableTitle", { flag: flag.key }),
                        description: t("flags.disableConsequence", { flag: flag.key }),
                        action: t("flags.confirmDisable"),
                        run: () => void updateFlag(flag, false),
                      })
                    : void updateFlag(flag, true)
                }
              >
                {flag.enabled ? t("flags.disable") : t("flags.enable")}
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section
        id="developer-prompts"
        className="developer-panel"
        aria-labelledby="developer-prompts-title"
      >
        <header className="developer-panel-heading">
          <div>
            <p className="type-label">{t("prompts.eyebrow")}</p>
            <h2 id="developer-prompts-title">{t("prompts.title")}</h2>
            <p>{t("prompts.description")}</p>
          </div>
        </header>
        <PromptVersions
          prompts={prompts}
          api={api}
          onPublished={(prompt) => {
            setPrompts((items) => [...items, prompt]);
            setAnnouncement(t("prompts.published", { version: numerals(prompt.version) }));
          }}
        />
      </section>

      <section
        id="developer-audit"
        className="developer-panel"
        aria-labelledby="developer-audit-title"
      >
        <header className="developer-panel-heading">
          <div>
            <p className="type-label">{t("audit.eyebrow")}</p>
            <h2 id="developer-audit-title">{t("audit.title")}</h2>
            <p>{t("audit.description")}</p>
          </div>
          <Badge tone="accent">{t("audit.tenThousand")}</Badge>
        </header>
        <AuditViewer locale={locale} />
      </section>

      <section
        id="developer-health"
        className="developer-panel"
        aria-labelledby="developer-health-title"
      >
        <header className="developer-panel-heading">
          <div>
            <p className="type-label">{t("health.eyebrow")}</p>
            <h2 id="developer-health-title">{t("health.title")}</h2>
            <p>{t("health.description")}</p>
          </div>
          <StatusPill status="completed" label={t("health.live")} />
        </header>
        <HealthDashboard health={health} locale={locale} />
      </section>

      <ConfirmDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
        title={confirmation?.title ?? ""}
        description={confirmation?.description ?? ""}
        closeLabel={t("close")}
        confirmLabel={confirmation?.action ?? ""}
        cancelLabel={t("cancel")}
        onConfirm={() => confirmation?.run()}
        tone="danger"
      >
        <p className="developer-destructive-note">
          <Icon name="alert" size={17} />
          {t("destructiveAudit")}
        </p>
      </ConfirmDialog>
    </main>
  );
}
