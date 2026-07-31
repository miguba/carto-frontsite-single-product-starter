export interface ISku {
  id: string;
  productSlug?: string;
  apiSku?: string;
  name: string;
  txts?: string[];
  originalPrice?: number;
  price: number;
  stock?: number;
}

export interface ICustomerInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface IShippingAddress {
  fullAddress: string;
  address2?: string;
  city: string;
  country: string;
  state: string;
  zipCode: string;
}

export interface IShippingInfo extends IShippingAddress {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface IBillingInfo extends IShippingInfo {
  isSameAsShippingInfo?: boolean;
}

interface ICartItem {
  skuId: string;
  quantity?: number;
  sku?: ISku;
}

export interface ICart {
  item?: ICartItem;
  items?: ICartItem[];
}

export interface ICheckout {
  cart: ICart;
  customerInfo?: ICustomerInfo;
  shippingInfo?: IShippingInfo;
  billingInfo?: IBillingInfo;
  isSameAsShippingAddress?: boolean;
  paymentMethod?: 'paypal' | 'stripe';
}

export interface FaqGroup {
  title: string;
  faqs: Array<{
    a: string;
    q: string[];
  }>;
}

export interface ProductDisplayConfig {
  mode: 'group' | 'single';
  group: {
    products: Array<{
      productSlug: string;
      label: string;
    }>;
  };
  single: {
    productSlug: string;
  };
}
