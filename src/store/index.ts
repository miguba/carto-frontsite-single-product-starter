import { map } from 'nanostores';
import type { ICheckout } from '@/types/app.type';

export const $checkout = map<Partial<ICheckout>>({ cart: undefined });
