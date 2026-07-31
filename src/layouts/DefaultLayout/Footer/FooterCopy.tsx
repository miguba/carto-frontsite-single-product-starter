import { i18n } from '@/lib/i18n';

interface Props {
  copyright: string;
  support?: string;
  currency: string;
  legal?: string;
}

export const FooterCopy = ({ copyright, support, currency, legal }: Props) => {
  return i18n(
    `footer.copy`,
    <div className="space-y-2 text-xs">
      {copyright && <p>{copyright}</p>}
      {(support || currency || legal) && (
        <hr className="my-3 border-gray-200" />
      )}
      {support && <p>{support}</p>}
      {currency && <p>{currency}</p>}
      {legal && (
        <p className="mx-auto max-w-6xl text-[11px] leading-4 text-neutral-400">
          {legal}
        </p>
      )}
    </div>,
  );
};
