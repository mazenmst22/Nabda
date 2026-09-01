import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export async function MessagesProvider({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider messages={await getMessages()}>{children}</NextIntlClientProvider>;
}
