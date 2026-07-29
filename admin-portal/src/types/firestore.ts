/**
 * Shared Firestore domain types.
 *
 * These mirror the schema written by the Buyer App (see Shop-Cart-Flow/lib
 * and Shop-Cart-Flow/context) so the Admin Portal reads/writes the exact
 * same collections and fields. Do not rename fields here without updating
 * the Buyer App too.
 */

// ---------------------------------------------------------------------------
// products/{productId}
// ---------------------------------------------------------------------------

export interface StockSize {
  code: string;
  label: string;
  weight: string;
  pricePerPiece: number;
}

export interface Product {
  id: string;
  name: string;
  desc: string;
  /** Storage download URL(s). Buyer App also ships bundled local fallback images by id. */
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  size: 'Small' | 'Medium' | 'Large';
  micron: number;
  material: string;
  sealing: string;
  heatResistance: string;
  moq: number;
  inStock: boolean;
  sizes: StockSize[];
  /** Category id, references categories/{categoryId}. Optional for legacy docs. */
  categoryId?: string;
  /** Admin-controlled visibility toggle. Hidden products are excluded from the Buyer App catalog. */
  visible?: boolean;
  discountPercent?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// categories/{categoryId}
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  enabled: boolean;
  sortOrder?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// orders/{orderId}
// ---------------------------------------------------------------------------

export type PouchType = 'plain' | 'printed' | 'kraft';
export type WindowOption = 'with' | 'without';
export type MaterialType = 'metalised' | 'non-metalised';
export type Capacity = '50g' | '100g' | '250g' | '500g' | '1kg';

export type OrderStatus =
  | 'confirmed'
  | 'approved'
  | 'production'
  | 'printing'
  | 'dispatched'
  | 'delivered';

export interface OrderItem {
  id: string;
  kind?: 'custom' | 'stock';
  quantity: number;
  price: number;
  pouchType?: PouchType;
  windowOption?: WindowOption;
  materialType?: MaterialType;
  capacity?: Capacity;
  pouchSize?: string;
  /** Artwork / reference file the buyer uploaded for printed pouches. */
  artworkUrl?: string;
  artworkName?: string;
  artworkSize?: number;
  productId?: string;
  productName?: string;
  sizeCode?: string;
  sizeLabel?: string;
  sizeWeight?: string;
  pricePerPiece?: number;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  address: string;
  gstNumber: string;
  paymentMethod: string;
  createdAt: string;
  status: OrderStatus;
  /** Admin-set courier tracking number, surfaced on the Buyer App order tracking screen. */
  trackingNumber?: string;
  courierName?: string;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// users/{uid}
// ---------------------------------------------------------------------------

export interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  gstNumber?: string;
  registeredAddress?: string;
  addresses?: Address[];
  wishlist?: string[];
  role: 'customer' | 'admin';
  createdAt?: unknown;
}

// ---------------------------------------------------------------------------
// packagingRequests/{requestId} — Custom Packaging module (design assistance
// requests submitted from the Buyer App's Design Assistance screen).
// ---------------------------------------------------------------------------

export type PackagingRequestStatus = 'new' | 'in_review' | 'in_progress' | 'completed' | 'rejected';

export interface PackagingRequest {
  id: string;
  userId: string;
  customerName?: string;
  service: string;
  message?: string;
  artworkUrls?: string[];
  notes?: string;
  status: PackagingRequestStatus;
  createdAt: unknown;
  updatedAt?: unknown;
}

// ---------------------------------------------------------------------------
// notifications/{notificationId} — Admin-sent notifications/promotions.
// ---------------------------------------------------------------------------

export type NotificationType = 'order_update' | 'promotional' | 'general';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  /** Empty/undefined targetUserId = broadcast to all customers. */
  targetUserId?: string;
  createdAt: unknown;
}

// ---------------------------------------------------------------------------
// settings/store — singleton doc for company/tax/shipping/payment settings.
// ---------------------------------------------------------------------------

export interface StoreSettings {
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  gstNumber?: string;
  taxPercent: number;
  shippingFlatRate: number;
  freeShippingThreshold?: number;
  paymentMethods: {
    upi: boolean;
    bankTransfer: boolean;
    creditTerms: boolean;
  };
  updatedAt?: unknown;
}
