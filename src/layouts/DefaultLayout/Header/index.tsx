import { siteTitle as defaultSiteTitle } from '../../../config/app.config';
import type { HeaderContent } from '@/lib/remote-content';

interface Props {
  siteTitle?: string;
  content: HeaderContent['branding'];
}

export const Header = ({ siteTitle = defaultSiteTitle, content }: Props) => {
  const interpolate = (text: string) =>
    text.replace(/\{siteTitle\}/g, siteTitle);
  const logoStyle = {
    ...(content.logoWidth ? { width: content.logoWidth } : {}),
    ...(content.logoHeight ? { height: content.logoHeight } : {}),
  };

  return (
    <header className="wrap">
      <div className="text-center py-5">
        <a href={content.href} className="inline-block">
          {content.logo && (
            <img
              src={interpolate(content.logo)}
              alt={interpolate(content.logoAlt)}
              className="block max-w-full"
              style={logoStyle}
              data-carto-field="branding.logo"
              data-carto-field-target="attr:src"
              data-carto-alt-field="branding.logoAlt"
              data-carto-style-fields="branding.logoWidth:width,branding.logoHeight:height"
            />
          )}
        </a>
      </div>
    </header>
  );
};
