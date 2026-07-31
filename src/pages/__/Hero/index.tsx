import classNames from 'classnames';
import type { FC } from 'react';

interface IProps {
  className?: string;
  image?: string;
  imageAlt?: string;
}

export const Hero: FC<IProps> = ({ className, image, imageAlt }) => {
  if (!image) return null;

  return (
    <section className={classNames([className])}>
      <img
        src={image}
        alt={imageAlt || 'Featured product'}
        fetchPriority="high"
        className=" max-w-full mx-auto block align-middle"
      />
    </section>
  );
};
