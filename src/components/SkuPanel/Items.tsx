import { useState, type FC } from 'react';
import { RadioIcon } from '@/pures/react/Icons';
import classNames from 'classnames';
import Button from '@/pures/react/Button';
import type { ISku } from '@/types/app.type';
import { $checkout } from '@/store';
import { useStore } from '@nanostores/react';
import { setLs } from '@/lib/storage';
import { formatPrice } from '@/lib/app';

interface IProps {
  className?: string;
  data: ISku[];
  onSelect?: (index: number) => void;
  initialSku?: string;
}

export const Items: FC<IProps> = ({
  className,
  data,
  onSelect,
  initialSku,
}) => {
  const initialIndex = data.findIndex(
    (item) => item.apiSku === initialSku || item.id === initialSku,
  );
  const [selected, setSelected] = useState<number>(
    initialIndex >= 0 ? initialIndex : 0,
  );

  const canAct = selected > -1;

  const checkout = useStore($checkout);

  const pickCart = () => {
    if (selected < 0) return;

    const sku = data[selected];

    $checkout.setKey(`cart`, {
      ...checkout?.cart,
      item: { skuId: sku.id, quantity: 1, sku },
    });

    setLs(`checkout`, $checkout.get());

    const checkoutUrl = new URL('/checkout', window.location.origin);
    if (sku.productSlug)
      checkoutUrl.searchParams.set('product', sku.productSlug);
    checkoutUrl.searchParams.set('sku', sku.apiSku || sku.id);
    checkoutUrl.searchParams.set('quantity', '1');
    window.location.href = checkoutUrl.toString();
  };

  return (
    <div className={classNames([``, className])}>
      <ul
        className={classNames([
          `*:border space-y-3 *:p-5 **:[h4]:text-2xl **:[h4]:font-semibold`,
        ])}
      >
        {data.map((item, index) => (
          <li
            key={item.id}
            className={classNames([
              'flex items-center gap-3 cursor-pointer transition-all duration-300',
              selected === index && 'border-primary',
            ])}
            onClick={() => {
              setSelected(index);
              onSelect?.(index);
              const url = new URL(window.location.href);
              if (item.productSlug)
                url.searchParams.set('product', item.productSlug);
              url.searchParams.set('sku', item.apiSku || item.id);
              url.hash = '';
              window.history.replaceState(null, '', url);
            }}
          >
            <div className="shrink-0 flex items-center justify-center w-7 h-7">
              {selected === index ? (
                <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-secondary">
                  <span className="block w-1.5 h-3 border-r-[2.5px] border-b-[2.5px] border-secondary-foreground rotate-45 -mt-0.5" />
                </span>
              ) : (
                <RadioIcon className="w-7 h-7" />
              )}
            </div>

            <div className="flex-auto space-y-2">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:justify-between">
                <div className="font-[500] text-gray-500 text-sm font-rm">
                  {item.txts?.[0]}
                </div>
                <div className="text-secondary relative -top-[3px] text-sm">
                  {item.stock} Available left
                </div>
              </div>

              <h4 className="">{item.name}</h4>

              <div className=" space-x-3">
                <span className=" font-bold text-gray-500 text-base relative">
                  {formatPrice(item.originalPrice ?? 0)}
                  <span className="absolute top-[50%] left-0 w-full h-[2px] z-10 bg-primary/50"></span>
                </span>
                <span className="font-bold text-primary text-xl">
                  {formatPrice(item.price ?? 0)}
                </span>
              </div>
              <div className=" text-gray-500 text-sm font-[300] font-rl">
                {item.txts?.[1]}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="pt-5">
        <Button
          disabled={!canAct}
          className="w-full rounded font-bold"
          size="lg"
          onClick={pickCart}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
};
