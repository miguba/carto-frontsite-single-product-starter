import classNames from 'classnames';
import type { FC } from 'react';
import { YesIcon } from '@/pures/react/Icons';
import { Items } from './Items';
import type { ISku } from '@/types/app.type';

interface IProps {
  className?: string;
  hdPic: string;
  title: string;
  features: string[];
  skus: ISku[];
  initialSku?: string;
}

export const TabItem: FC<IProps> = ({
  className,
  hdPic,
  title,
  features,
  skus,
  initialSku,
}) => {
  return (
    <section className={classNames([``, className])}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 ">
        <div className="space-y-5">
          <div>
            <img
              className="border-4 border-primary"
              src={hdPic}
              alt={title}
              loading="lazy"
            />
          </div>

          <h2>{title}</h2>

          <ul className="space-y-2">
            {features.map((n) => {
              return (
                <li key={n} className="flex items-center gap-2">
                  <span>
                    <YesIcon className="inline-block text-lg text-secondary" />
                  </span>
                  {n}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="skus pb-8">
          <Items data={skus} initialSku={initialSku} />
        </div>
      </div>
    </section>
  );
};
