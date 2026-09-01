export type PreviewEnvironment = "development" | "production" | "test";

export function isPreviewEnabled(
  environment: PreviewEnvironment | undefined = process.env.NODE_ENV,
  flag: string | undefined = process.env.NEXT_PUBLIC_ENABLE_PREVIEW,
) {
  return environment === "development" && flag === "1";
}

export function requirePreviewEnabled(
  environment: PreviewEnvironment | undefined,
  flag: string | undefined,
  onNotFound: () => never,
) {
  if (!isPreviewEnabled(environment, flag)) onNotFound();
}
