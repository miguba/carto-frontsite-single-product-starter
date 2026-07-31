import { FooterCopy } from './FooterCopy';
import { siteTitle as defaultSiteTitle } from '../../../config/app.config';
import type { FooterContent } from '@/lib/remote-content';

interface Props {
  siteTitle?: string;
  supportEmail?: string;
  copyrightYear?: string;
  content: FooterContent;
}

export const Footer = ({
  siteTitle = defaultSiteTitle,
  supportEmail,
  copyrightYear,
  content,
}: Props) => {
  const values = {
    siteTitle,
    supportEmail: supportEmail || '',
    year: copyrightYear || String(new Date().getFullYear()),
  };
  const interpolate = (text: string) =>
    text.replace(
      /\{(siteTitle|supportEmail|year)\}/g,
      (_, key: keyof typeof values) => values[key],
    );

  return (
    <footer className="wrap space-y-3 py-6 text-center text-neutral-500 md:py-8 mb-20">
      {(content.branding.prefix ||
        content.branding.logo ||
        content.branding.name) && (
        <div>
          <p className="inline-flex items-center gap-2 text-sm text-black">
            {content.branding.prefix && (
              <span className="font-bold font-h">
                {interpolate(content.branding.prefix)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              {content.branding.logo && (
                <img
                  src={interpolate(content.branding.logo)}
                  alt={interpolate(content.branding.logoAlt)}
                  width="14"
                  height="14"
                  className="max-w-[14px] h-auto"
                />
              )}
              {content.branding.name && (
                <span className="font-bold font-h text-black">
                  {interpolate(content.branding.name)}
                </span>
              )}
            </span>
          </p>
        </div>
      )}

      {content.navigation.items.length > 0 && (
        <nav
          aria-label={content.navigation.ariaLabel}
          className="text-sm space-x-3"
        >
          {content.navigation.items.map((item) => (
            <a href={item.href} key={`${item.href}-${item.label}`}>
              {interpolate(item.label)}
            </a>
          ))}
        </nav>
      )}

      <FooterCopy
        copyright={interpolate(content.details.copyright)}
        support={
          supportEmail ? interpolate(content.details.support) : undefined
        }
        currency={interpolate(content.details.currency)}
        legal={interpolate(content.details.legal)}
      />
    </footer>
  );
};
