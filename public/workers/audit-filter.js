globalThis.onmessage = async function (event) {
  const message = event.data;
  if (message.type === "load") {
    try {
      const response = await fetch(message.url, { credentials: "same-origin" });
      if (!response.ok) throw new Error("audit request failed");
      const payload = await response.json();
      if (
        !payload ||
        !Array.isArray(payload.items) ||
        !payload.items.every(
          (row) =>
            typeof row.id === "string" &&
            typeof row.actor === "string" &&
            typeof row.entity === "string" &&
            typeof row.occurredAt === "string",
        )
      ) {
        throw new Error("audit payload invalid");
      }
      globalThis.auditRows = payload.items;
      globalThis.postMessage({ type: "ready", total: globalThis.auditRows.length });
    } catch (error) {
      globalThis.postMessage({
        type: "error",
        detail: error instanceof Error ? error.message : "audit worker failed",
      });
    }
    return;
  }
  if (message.type !== "filter") return;
  const started = performance.now();
  const rows = globalThis.auditRows || [];
  const actor = message.filters.actor.trim().toLocaleLowerCase();
  const entity = message.filters.entity.trim().toLocaleLowerCase();
  const from = message.filters.from ? `${message.filters.from}T00:00:00.000Z` : "";
  const to = message.filters.to ? `${message.filters.to}T23:59:59.999Z` : "";
  const matches = rows.filter(
    (row) =>
      (!actor || row.actor.toLocaleLowerCase().includes(actor)) &&
      (!entity || row.entity.toLocaleLowerCase().includes(entity)) &&
      (!from || row.occurredAt >= from) &&
      (!to || row.occurredAt <= to),
  );
  const start = (message.page - 1) * message.pageSize;
  globalThis.postMessage({
    type: "result",
    requestId: message.requestId,
    total: matches.length,
    items: matches.slice(start, start + message.pageSize),
    durationMs: performance.now() - started,
  });
};
