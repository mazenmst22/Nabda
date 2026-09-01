import { delay, HttpResponse } from "msw";
import type { JsonBodyType } from "msw";

const initialControls = { latencyMs: 0, offline: false };
export const mockControls = { ...initialControls };

export function setMockLatency(latencyMs: number) {
  mockControls.latencyMs = Math.max(0, latencyMs);
}

export function setMockOffline(offline: boolean) {
  mockControls.offline = offline;
}

export function resetMockControls() {
  Object.assign(mockControls, initialControls);
}

export async function mockJson<T extends JsonBodyType>(data: T, init?: ResponseInit) {
  if (mockControls.offline) return HttpResponse.error();
  if (mockControls.latencyMs > 0) await delay(mockControls.latencyMs);
  return HttpResponse.json(data, init);
}
