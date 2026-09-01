import { Icon, Ltr } from "@/components/ui";

export function BookingSignIn({
  returnTo,
  labels,
}: {
  returnTo: string;
  labels: { secure: string; title: string; text: string; patient: string; action: string };
}) {
  return (
    <main className="booking-auth shell">
      <section>
        <span className="booking-auth-mark">
          <Icon name="shield" size={24} />
        </span>
        <p className="type-label">{labels.secure}</p>
        <h1 className="type-h1">{labels.title}</h1>
        <p>{labels.text}</p>
        <div className="booking-auth-person">
          <Icon name="user" />
          <span>
            <small>{labels.patient}</small>
            <strong>Amal Hassan</strong>
            <Ltr>+20 100 123 4567</Ltr>
          </span>
        </div>
        <a href={returnTo} className="ui-button ui-button--primary booking-auth-action">
          <span>{labels.action}</span>
        </a>
      </section>
    </main>
  );
}
