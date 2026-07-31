import { siteTitle as defaultSiteTitle } from '../../../config/app.config';
import type { HeaderContent } from '@/lib/remote-content';

interface Props {
  siteTitle?: string;
  content: HeaderContent['branding'];
}

export const Header = ({ siteTitle = defaultSiteTitle, content }: Props) => {
  const interpolate = (text: string) =>
    text.replace(/\{siteTitle\}/g, siteTitle);

  return (
    <header className="wrap">
      <div className="text-center py-5">
        <a href={content.href} className="inline-flex items-center gap-3">
          {content.logo && (
            <img
              src={interpolate(content.logo)}
              alt={interpolate(content.logoAlt)}
              width="50"
              height="50"
              className="max-w-[40px] md:max-w-[50px] h-auto"
            />
          )}
          {content.title && (
            <span className="text-3xl md:text-5xl font-bold font-h">
              {interpolate(content.title)}
            </span>
          )}
        </a>
      </div>
    </header>
  );
};
