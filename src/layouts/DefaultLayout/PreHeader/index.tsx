import { i18n } from '@/lib/i18n';
import type { HeaderContent } from '@/lib/remote-content';

export const PreHeader = ({
  content,
}: {
  content: HeaderContent['announcement'];
}) => {
  if (!content.text) return null;

  return i18n(
    `layout.header.pre`,
    <div className="bg-preheader">
      <div className="wrap text-white text-center py-1">
        <div>
          <a href={content.href}>{content.text}</a>
        </div>
      </div>
    </div>,
  );
};
