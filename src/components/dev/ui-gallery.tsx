"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Combobox,
  ConfirmDialog,
  DataGrid,
  DatePicker,
  Dialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Ltr,
  Pagination,
  Select,
  Sheet,
  Skeleton,
  StatusPill,
  Tabs,
  Textarea,
  TimeSlotChip,
  Toast,
  ToastProvider,
  Tooltip,
  useToast,
} from "@/components/ui";
import type { ComboboxOption, DataGridColumn, Status } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";
import { formatMoney } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";

type GalleryForm = { patientName: string; notes: string; clinic: string };
type AppointmentRow = { id: string; doctor: string; time: string; fee: number; status: Status };

function GalleryContent({ locale }: { locale: AppLocale }) {
  const t = useTranslations("admin.uiGallery");
  const common = useTranslations("common");
  const formatNumber = useNumerals();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [date, setDate] = useState("2026-08-29");
  const [page, setPage] = useState(2);
  const methods = useForm<GalleryForm>({
    defaultValues: { patientName: "", notes: "", clinic: "maadi" },
  });

  useEffect(() => {
    methods.setError("patientName", { message: t("patientNameError") });
  }, [methods, t]);

  const doctorOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: "mariam", label: t("doctorMariam"), description: t("doctorMariamDetail") },
      { value: "omar", label: t("doctorOmar"), description: t("doctorOmarDetail") },
      { value: "nour", label: t("doctorNour"), description: t("doctorNourDetail") },
    ],
    [t],
  );
  const loadDoctors = useCallback(
    async (query: string) => {
      const normalized = query.trim().toLocaleLowerCase(locale);
      return doctorOptions.filter((option) =>
        `${option.label} ${option.description ?? ""}`
          .toLocaleLowerCase(locale)
          .includes(normalized),
      );
    },
    [doctorOptions, locale],
  );
  const statusLabels = useMemo<Record<Status, string>>(
    () => ({
      available: t("statusAvailable"),
      held: t("statusHeld"),
      booked: t("statusBooked"),
      "checked-in": t("statusCheckedIn"),
      "in-progress": t("statusInProgress"),
      completed: t("statusCompleted"),
      cancelled: t("statusCancelled"),
      "no-show": t("statusNoShow"),
    }),
    [t],
  );
  const appointments = useMemo<AppointmentRow[]>(
    () => [
      { id: "NBD-A", doctor: t("doctorMariam"), time: "09:30", fee: 450, status: "booked" },
      { id: "NBD-B", doctor: t("doctorOmar"), time: "11:00", fee: 520, status: "held" },
      { id: "NBD-C", doctor: t("doctorNour"), time: "13:15", fee: 380, status: "checked-in" },
    ],
    [t],
  );
  const columns = useMemo<DataGridColumn<AppointmentRow>[]>(
    () => [
      {
        key: "doctor",
        header: t("doctorColumn"),
        cell: (row) => row.doctor,
        sortValue: (row) => row.doctor,
      },
      {
        key: "time",
        header: t("timeColumn"),
        cell: (row) => <Ltr>{formatNumber(row.time)}</Ltr>,
        sortValue: (row) => row.time,
      },
      {
        key: "fee",
        header: t("feeColumn"),
        cell: (row) => <Ltr>{formatMoney({ amount: row.fee, currency: "EGP", locale })}</Ltr>,
        sortValue: (row) => row.fee,
      },
      {
        key: "status",
        header: t("statusColumn"),
        cell: (row) => <StatusPill status={row.status} label={statusLabels[row.status]} />,
      },
    ],
    [formatNumber, locale, statusLabels, t],
  );

  return (
    <main className="ui-gallery-page">
      <header className="ui-gallery-hero">
        <div>
          <span className="type-label ui-gallery-kicker">{t("kicker")}</span>
          <h1 className="type-display">{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <div className="ui-gallery-controls">
          <LanguageSwitcher locale={locale} label={t("language")} className="ui-gallery-language" />
          <ThemeSwitcher
            labels={{
              label: common("theme"),
              system: common("themeSystem"),
              light: common("themeLight"),
              dark: common("themeDark"),
            }}
          />
        </div>
      </header>

      <GallerySection title={t("buttons")} intro={t("buttonsIntro")}>
        <div className="ui-gallery-row">
          <Button data-gallery-focus="primary">{t("primary")}</Button>
          <Button variant="secondary">{t("secondary")}</Button>
          <Button variant="ghost">{t("ghost")}</Button>
          <Button variant="danger">{t("danger")}</Button>
          <Button variant="pulse" leadingIcon="spark">
            {t("pulse")}
          </Button>
          <Button loading loadingLabel={t("loading")}>
            {t("primary")}
          </Button>
          <Button disabled>{t("disabled")}</Button>
          <IconButton label={t("iconButton")} icon="plus" data-gallery-focus="icon-button" />
        </div>
      </GallerySection>

      <GallerySection title={t("forms")} intro={t("formsIntro")}>
        <FormProvider {...methods}>
          <form className="ui-gallery-form" onSubmit={(event) => event.preventDefault()}>
            <Field
              name="patientName"
              label={t("patientName")}
              hint={t("patientNameHint")}
              required
              rules={{ required: t("patientNameError") }}
            >
              <Input placeholder={t("patientNamePlaceholder")} data-gallery-focus="input" />
            </Field>
            <Field name="notes" label={t("notes")}>
              <Textarea placeholder={t("notesPlaceholder")} data-gallery-focus="textarea" />
            </Field>
            <Field name="clinic" label={t("clinic")}>
              <Select data-gallery-focus="select">
                <option value="">{t("chooseClinic")}</option>
                <option value="maadi">{t("maadiClinic")}</option>
                <option value="dokki">{t("dokkiClinic")}</option>
              </Select>
            </Field>
            <Field name="reference" label={t("disabledField")}>
              <Input value="NBD-REF" disabled />
            </Field>
            <div className="ui-gallery-field-span">
              <span className="ui-gallery-control-label">{t("combobox")}</span>
              <Combobox
                label={t("combobox")}
                placeholder={t("comboboxPlaceholder")}
                loadingLabel={t("comboboxLoading")}
                emptyLabel={t("comboboxEmpty")}
                loadOptions={loadDoctors}
              />
            </div>
          </form>
        </FormProvider>
      </GallerySection>

      <GallerySection title={t("dateAndTime")} intro={t("dateAndTimeIntro")}>
        <div className="ui-gallery-date-grid">
          <DatePicker
            locale={locale}
            value={date}
            onChange={setDate}
            formatNumber={formatNumber}
            labels={{
              open: t("openCalendar"),
              previousMonth: t("previousMonth"),
              nextMonth: t("nextMonth"),
              chooseDate: t("chooseDate"),
            }}
          />
          <div className="ui-gallery-row">
            <TimeSlotChip time={formatNumber("09:30")} unavailableLabel={t("unavailable")} />
            <TimeSlotChip
              time={formatNumber("10:15")}
              state="selected"
              unavailableLabel={t("unavailable")}
            />
            <TimeSlotChip
              time={formatNumber("11:45")}
              state="unavailable"
              unavailableLabel={t("unavailable")}
            />
          </div>
        </div>
      </GallerySection>

      <GallerySection title={t("feedback")} intro={t("feedbackIntro")}>
        <div className="ui-gallery-statuses">
          {(Object.keys(statusLabels) as Status[]).map((status) => (
            <StatusPill key={status} status={status} label={statusLabels[status]} />
          ))}
        </div>
        <div className="ui-gallery-row">
          <Badge>{t("badgeNeutral")}</Badge>
          <Badge tone="accent">{t("badgeAccent")}</Badge>
          <Badge tone="warning">{t("badgeWarning")}</Badge>
        </div>
        <div className="ui-gallery-toast-grid">
          <Toast
            title={t("toastSuccess")}
            description={t("toastSuccessDetail")}
            closeLabel={t("close")}
          />
          <Toast
            title={t("toastInfo")}
            description={t("toastInfoDetail")}
            tone="info"
            closeLabel={t("close")}
          />
          <Toast
            title={t("toastDanger")}
            description={t("toastDangerDetail")}
            tone="danger"
            closeLabel={t("close")}
          />
        </div>
        <div className="ui-gallery-row">
          <Button
            variant="secondary"
            onClick={() =>
              toast({ title: t("toastSuccess"), description: t("toastSuccessDetail") })
            }
          >
            {t("showSuccessToast")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({ title: t("toastInfo"), description: t("toastInfoDetail"), tone: "info" })
            }
          >
            {t("showInfoToast")}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast({
                title: t("toastDanger"),
                description: t("toastDangerDetail"),
                tone: "danger",
              })
            }
          >
            {t("showDangerToast")}
          </Button>
        </div>
      </GallerySection>

      <GallerySection title={t("overlays")} intro={t("overlaysIntro")}>
        <div className="ui-gallery-row">
          <Button
            variant="secondary"
            onClick={() => setDialogOpen(true)}
            data-gallery-focus="dialog"
          >
            {t("openDialog")}
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)} data-gallery-focus="sheet">
            {t("openSheet")}
          </Button>
          <Button
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            data-gallery-focus="confirm"
          >
            {t("openConfirm")}
          </Button>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={t("dialogTitle")}
          description={t("dialogDescription")}
          closeLabel={t("close")}
          footer={<Button onClick={() => setDialogOpen(false)}>{t("primary")}</Button>}
        >
          <p>{t("dialogBody")}</p>
        </Dialog>
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={t("sheetTitle")}
          description={t("sheetDescription")}
          closeLabel={t("close")}
        >
          <p>{t("sheetBody")}</p>
        </Sheet>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t("confirmTitle")}
          description={t("confirmDescription")}
          closeLabel={t("close")}
          confirmLabel={t("confirmAction")}
          cancelLabel={t("keepAction")}
          onConfirm={() =>
            toast({ title: t("toastDanger"), description: t("toastDangerDetail"), tone: "danger" })
          }
        >
          <p>{t("confirmBody")}</p>
        </ConfirmDialog>
      </GallerySection>

      <GallerySection title={t("data")} intro={t("dataIntro")}>
        <DataGrid
          caption={t("appointmentsTable")}
          columns={columns}
          rows={appointments}
          rowKey={(row) => row.id}
        />
        <Tabs
          label={t("tabsLabel")}
          items={[
            { id: "upcoming", label: t("tabUpcoming"), content: <p>{t("tabUpcomingBody")}</p> },
            { id: "past", label: t("tabPast"), content: <p>{t("tabPastBody")}</p> },
            { id: "cancelled", label: t("tabCancelled"), content: <p>{t("tabCancelledBody")}</p> },
          ]}
        />
        <Pagination
          currentPage={page}
          totalPages={5}
          onPageChange={setPage}
          previousLabel={t("previousPage")}
          nextLabel={t("nextPage")}
          pageLabel={(value) => t("pageLabel", { page: value })}
          formatPage={(value) => formatNumber(value)}
        />
      </GallerySection>

      <GallerySection title={t("content")}>
        <div className="ui-gallery-content-grid">
          <Card>
            <div className="ui-gallery-card-heading">
              <Avatar name={t("sampleCardTitle")} />
              <div>
                <strong>{t("sampleCardTitle")}</strong>
                <p>{t("sampleCardBody")}</p>
              </div>
            </div>
            <div className="ui-gallery-row" role="group" aria-label={t("avatarGroup")}>
              <Avatar name={t("sampleCardTitle")} size="small" />
              <Avatar name={t("sampleCardTitle")} />
              <Avatar name={t("sampleCardTitle")} size="large" />
            </div>
          </Card>
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={<Button variant="secondary">{t("emptyAction")}</Button>}
          />
          <Card>
            <Skeleton label={t("loadingContent")} />
          </Card>
        </div>
        <Tooltip content={t("tooltip")}>
          <IconButton label={t("tooltipAction")} icon="info" data-gallery-focus="tooltip" />
        </Tooltip>
      </GallerySection>
    </main>
  );
}

function GallerySection({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ui-gallery-section">
      <header>
        <h2 className="type-h2">{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </header>
      <div className="ui-gallery-section__body">{children}</div>
    </section>
  );
}

export function UiGallery({ locale }: { locale: AppLocale }) {
  const t = useTranslations("admin.uiGallery");
  return (
    <ToastProvider closeLabel={t("close")}>
      <GalleryContent locale={locale} />
    </ToastProvider>
  );
}
