import "server-only";

import { readdir } from "node:fs/promises";
import path from "node:path";

export const previewAreas = [
  "Public",
  "Booking",
  "Patient",
  "Pulse",
  "Reception",
  "Doctor",
  "Developer",
] as const;

export const previewScenarios = [
  "happy",
  "loading",
  "empty",
  "error",
  "permission-denied",
  "slot-taken",
  "hold-expired",
  "low-confidence",
  "invalid-json",
] as const;

export type PreviewArea = (typeof previewAreas)[number];
export type PreviewScenario = (typeof previewScenarios)[number];
export type PreviewRole = "public" | "patient" | "receptionist" | "doctor" | "developer";

export type PreviewEntry = {
  id: string;
  name: string;
  area: PreviewArea;
  path: string;
  source: string;
  role: PreviewRole;
  scenario: PreviewScenario;
  supported: boolean;
  blockedReason?: string;
};

type DiscoveredRoute = Omit<PreviewEntry, "id" | "scenario" | "supported" | "blockedReason">;

const scenarioNames: Record<PreviewScenario, string> = {
  happy: "Default",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  "permission-denied": "Permission denied",
  "slot-taken": "Slot taken",
  "hold-expired": "Hold expired",
  "low-confidence": "Low confidence",
  "invalid-json": "Invalid JSON",
};

function routeArea(group: string, routePath: string): PreviewArea {
  if (routePath === "/pulse") return "Pulse";
  if (routePath.startsWith("/doctor/") || routePath.startsWith("/clinic/")) return "Booking";
  if (group === "patient") return "Patient";
  if (group === "reception") return "Reception";
  if (group === "doctor") return "Doctor";
  if (group === "developer" || group === "preview") return "Developer";
  return "Public";
}

function routeRole(area: PreviewArea): PreviewRole {
  if (area === "Patient") return "patient";
  if (area === "Reception") return "receptionist";
  if (area === "Doctor") return "doctor";
  if (area === "Developer") return "developer";
  return "public";
}

function resolveParameter(segment: string, previous: string | undefined) {
  if (segment === "[slug]" && previous === "clinic") return "andalusia-maadi";
  if (segment === "[slug]" && previous === "doctor") return "mariam-fouad";
  if (segment === "[slug]" && previous === "specialty") return "cardiology";
  if (segment === "[id]" && previous === "appointments") return "appointment-upcoming-mariam";
  return `fixture-${segment.slice(1, -1)}`;
}

function displayName(routePath: string) {
  if (routePath === "") return "Home";
  return routePath
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .split("-")
        .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
        .join(" "),
    )
    .join(" · ");
}

async function walk(
  directory: string,
  relativeSegments: string[] = [],
): Promise<DiscoveredRoute[]> {
  const directoryEntries = await readdir(directory, { withFileTypes: true });
  const pageExists = directoryEntries.some((entry) => entry.isFile() && entry.name === "page.tsx");
  const routes: DiscoveredRoute[] = [];

  if (pageExists) {
    const groupSegment = relativeSegments.find((segment) => /^\(.+\)$/u.test(segment));
    const group = groupSegment?.slice(1, -1) ?? "public";
    const visibleSegments = relativeSegments.filter((segment) => !/^\(.+\)$/u.test(segment));
    const resolvedSegments = visibleSegments.map((segment, index) =>
      segment.startsWith("[") ? resolveParameter(segment, visibleSegments[index - 1]) : segment,
    );
    const routePath = resolvedSegments.length ? `/${resolvedSegments.join("/")}` : "";
    const area = routeArea(group, routePath);
    routes.push({
      name: displayName(routePath),
      area,
      path: routePath,
      source: `${relativeSegments.join("/") || "(public)"}/page.tsx`,
      role: routeRole(area),
    });
  }

  const children = directoryEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const child of children) {
    routes.push(
      ...(await walk(path.join(directory, child.name), [...relativeSegments, child.name])),
    );
  }
  return routes;
}

function scenarioSupport(route: DiscoveredRoute, scenario: PreviewScenario) {
  if (scenario === "happy") return { supported: true };
  if (
    scenario === "permission-denied" &&
    route.role !== "public" &&
    route.path !== "/dev/preview"
  ) {
    return { supported: true };
  }
  if (scenario === "empty" && route.path === "/search") return { supported: true };
  if ((scenario === "slot-taken" || scenario === "hold-expired") && route.area === "Booking") {
    return { supported: true };
  }
  if ((scenario === "low-confidence" || scenario === "invalid-json") && route.path === "/doctor") {
    return { supported: true };
  }
  return {
    supported: false,
    blockedReason:
      "This route is server-fed and does not expose this state through MSW. The entry remains visible rather than replacing the product screen with preview-only markup.",
  };
}

function scenariosFor(route: DiscoveredRoute): PreviewScenario[] {
  const scenarios: PreviewScenario[] = ["happy", "loading", "empty", "error", "permission-denied"];
  if (route.area === "Booking") scenarios.push("slot-taken", "hold-expired");
  if (route.path === "/doctor") scenarios.push("low-confidence", "invalid-json");
  return scenarios;
}

export async function discoverPreviewEntries(
  root = path.join(process.cwd(), "src", "app", "[locale]"),
) {
  const routes = (await walk(root)).sort(
    (left, right) =>
      previewAreas.indexOf(left.area) - previewAreas.indexOf(right.area) ||
      left.path.localeCompare(right.path),
  );

  return routes.flatMap((route) =>
    scenariosFor(route).map((scenario) => {
      const support = scenarioSupport(route, scenario);
      const routeKey = route.path === "" ? "home" : route.path.slice(1).replaceAll("/", "--");
      return {
        ...route,
        id: `${routeKey}--${scenario}`,
        name: `${route.name} — ${scenarioNames[scenario]}`,
        scenario,
        ...support,
      };
    }),
  );
}
