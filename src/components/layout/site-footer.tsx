import Image from "next/image";
import Link from "next/link";

type FooterLabels = {
  brand: string;
  tagline: string;
  about: string;
  patients: string;
  legal: string;
  privacy: string;
  terms: string;
  contact: string;
  licence: string;
  copyright: string;
};

export function SiteFooter({ locale, labels }: { locale: string; labels: FooterLabels }) {
  return (
    <footer className="site-footer" id="footer">
      <div className="interval-motif" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="shell footer-grid">
        <div className="footer-brand">
          <Link prefetch={false} href={`/${locale}`} className="brand-lockup footer-lockup">
            <Image src="/nabda-mark.svg" width={48} height={43} alt="" />
            <span>{labels.brand}</span>
          </Link>
          <p>{labels.tagline}</p>
        </div>
        <div>
          <h2>{labels.about}</h2>
          <Link prefetch={false} href={`/${locale}/about`}>
            {labels.patients}
          </Link>
          <Link prefetch={false} href={`/${locale}/for-clinics`}>
            {labels.contact}
          </Link>
        </div>
        <div>
          <h2>{labels.legal}</h2>
          <Link prefetch={false} href={`/${locale}/privacy`}>
            {labels.privacy}
          </Link>
          <Link prefetch={false} href={`/${locale}/terms`}>
            {labels.terms}
          </Link>
        </div>
        <p className="licence-note">{labels.licence}</p>
      </div>
      <div className="shell footer-bottom">
        <span>{labels.copyright}</span>
        <span className="footer-cairo">Cairo · Egypt</span>
      </div>
    </footer>
  );
}
