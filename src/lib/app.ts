import type { ICart } from '@/types/app.type';

export const formatPrice = (price: number, len = 2) =>
  `$${(price / 100).toFixed(len)}`;

export const getSubTotal = (cart: ICart) => {
  const items = [cart?.item, ...(cart?.items || [])].filter(Boolean);
  return items.reduce(
    (total, item) =>
      total + (item?.sku?.price || 0) * (item?.quantity || 1),
    0,
  );
};
