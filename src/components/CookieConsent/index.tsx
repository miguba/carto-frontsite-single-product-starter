import { useEffect, useState } from 'react';
import type { CookieConsentContent } from '@/lib/remote-content';

const STORAGE_KEY = 'cookie-consent';

export const CookieConsent = ({
  content,
}: {
  content: CookieConsentContent;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
    // Reload to trigger GTM loading
    window.location.reload();
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  const descriptionParts = content.description.split('{privacyPolicy}');

  return (
    <aside
      aria-label={content.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {content.heading && <h2 className="sr-only">{content.heading}</h2>}
          {content.description && (
            <p className="max-w-5xl text-sm leading-5 text-gray-600">
              {descriptionParts.map((part, index) => (
                <span key={`${index}-${part}`}>
                  {part}
                  {index < descriptionParts.length - 1 &&
                    content.privacyPolicy.label &&
                    content.privacyPolicy.href && (
                      <a
                        href={content.privacyPolicy.href}
                        className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        {content.privacyPolicy.label}
                      </a>
                    )}
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-3">
          {content.declineLabel && (
            <button
              onClick={decline}
              className="min-w-20 cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {content.declineLabel}
            </button>
          )}
          {content.acceptLabel && (
            <button
              onClick={accept}
              className="min-w-20 cursor-pointer rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {content.acceptLabel}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
