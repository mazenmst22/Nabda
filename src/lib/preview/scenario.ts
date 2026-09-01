import { isPreviewEnabled } from "./access";

export function previewScenarioFromRequest(request: Request) {
  if (!isPreviewEnabled()) return null;
  const headerScenario = request.headers.get("X-Nabda-MSW-Scenario");
  if (headerScenario) return headerScenario;
  const cookieScenario = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === "nabda_preview_scenario")?.[1];
  if (cookieScenario) return decodeURIComponent(cookieScenario);
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).searchParams.get("mswScenario");
  } catch {
    return null;
  }
}
