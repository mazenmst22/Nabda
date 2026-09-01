"use client";

import { useTranslations } from "next-intl";
import { Button, Icon, Ltr, StatusPill } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import type { PulseBookingProposal } from "./types";

export function ToolConfirmationCard({
  locale,
  proposal,
  onConfirm,
  onCancel,
}: {
  locale: "ar" | "en";
  proposal: PulseBookingProposal;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("pulse");
  const numerals = useNumerals();
  const date = numerals(
    formatDateTime(proposal.slotStart, {
      locale,
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
  const time = numerals(
    formatDateTime(proposal.slotStart, {
      locale,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );
  const fee = numerals(formatMoney({ ...proposal.price, locale }));
  const pending = proposal.status === "pending";
  const committing = proposal.status === "committing";

  return (
    <section
      className="pulse-tool-card"
      aria-labelledby={`pulse-tool-${proposal.id}`}
      data-tool-status={proposal.status}
    >
      <header>
        <span className="pulse-tool-icon">
          <Icon name="calendar" size={19} />
        </span>
        <div>
          <p className="type-label">{t("tool.proposed")}</p>
          <h2 id={`pulse-tool-${proposal.id}`}>{t("tool.title")}</h2>
        </div>
        {proposal.status === "committed" ? (
          <StatusPill status="booked" label={t("tool.committed")} />
        ) : proposal.status === "cancelled" ? (
          <StatusPill status="cancelled" label={t("tool.cancelled")} />
        ) : null}
      </header>
      <dl>
        <div>
          <dt>{t("tool.doctor")}</dt>
          <dd>{proposal.doctorName}</dd>
        </div>
        <div>
          <dt>{t("tool.date")}</dt>
          <dd>{date}</dd>
        </div>
        <div>
          <dt>{t("tool.time")}</dt>
          <dd>
            <Ltr>{time}</Ltr>
          </dd>
        </div>
        <div>
          <dt>{t("tool.fee")}</dt>
          <dd>
            <Ltr>{fee}</Ltr>
          </dd>
        </div>
        <div>
          <dt>{t("tool.payment")}</dt>
          <dd>{t("tool.payAtClinic")}</dd>
        </div>
      </dl>
      {proposal.status === "committed" && proposal.appointment ? (
        <p className="pulse-tool-result" role="status">
          <Icon name="double-check" size={18} />
          <span>
            {t("tool.committedReference")} <Ltr>{proposal.appointment.id}</Ltr>
          </span>
        </p>
      ) : null}
      {pending || committing ? (
        <footer>
          <Button variant="ghost" disabled={committing} onClick={onCancel}>
            {t("tool.cancel")}
          </Button>
          <Button
            variant="pulse"
            leadingIcon="double-check"
            loading={committing}
            loadingLabel={t("tool.confirming")}
            onClick={onConfirm}
            data-testid="pulse-confirm-booking"
          >
            {t("tool.confirm")}
          </Button>
        </footer>
      ) : null}
    </section>
  );
}
