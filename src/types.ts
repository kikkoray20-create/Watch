export interface WatchModel {
  id: string;
  name: string;
  brand: string;
  price: number;
  category: string;
  imageUrl: string;
  images?: string[];
  description: string;
  specs: {
    caseSize: string;
    waterResistance: string;
    crystal: string;
    movement: string;
  };
  stock: number;
  rating: number;
}

export interface CartItem {
  watch: WatchModel;
  quantity: number;
}

export interface PaymentDetails {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  giftWrapping: boolean;
  discountCode: string;
}

export interface CheckoutDetails extends ShippingDetails, PaymentDetails {}

export interface AcademyLesson {
  id: string;
  title: string;
  category: 'architecture' | 'catalog' | 'payments' | 'logistics' | 'marketing';
  shortDesc: string;
  fullMarkdown: string;
  interactiveComponent?: string;
  codeSnippet?: {
    language: string;
    filename: string;
    code: string;
  };
}

export interface WebhookLog {
  id: string;
  event: string;
  timestamp: string;
  status: 'sent' | 'pending' | 'failed' | 'success';
  payload: any;
  explanation: string;
}

export interface UserProfile {
  email: string;
  fullName: string;
  isLoggedIn: boolean;
  memberTier: 'Loyal Collector' | 'Vanguard' | 'Grand Sovereign' | 'Master Horologist';
  loyaltyPoints: number;
  isAdmin?: boolean;
}

export interface GiftBoxOption {
  id: string;
  name: string;
  price: number;
}

export interface BoutiqueSettings {
  storeName: string;
  categories?: string[];
  promoCode: string;
  promoDiscountPercent: number;
  heroTitle: string;
  heroSub: string;
  heroDesc: string;
  warrantyActive: boolean;
  isPromotionActive?: boolean;
  giftWrappingEnabled?: boolean;
  giftBoxOptions?: GiftBoxOption[];
  freeShippingEnabled?: boolean;
  freeShippingThreshold?: number;
}

export interface CompactOrder {
  id: string;
  date: string;
  total: number;
  items: CartItem[];
  shippingDetails: ShippingDetails;
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'rejected';
  trackingNumber: string;
}

