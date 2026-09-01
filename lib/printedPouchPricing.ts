/**
 * lib/printedPouchPricing.ts
 *
 * Fetches and caches Printed Customized Pouch pricing from Firestore.
 * Subscribes to real-time updates so any price change in the Admin Portal
 * is reflected immediately without an app restart.
 *
 * Only applies to `pouchType === 'printed'`.
 * Plain Pouches and Kraft Pouches are NOT affected.
 */

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Capacity } from '@/context/CartContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CombinationPrices {
  /** Without Window + Non-Metalised */
  noWindowNonMetal: number;
  /** Without Window + Metalised */
  noWindowMetal: number;
  /** With Window + Non-Metalised */
  windowNonMetal: number;
  /** With Window + Metalised */
  windowMetal: number;
}

export interface PrintedPouchPricing {
  combinations: CombinationPrices;
  capacityMultipliers: Record<Capacity, number>;
  minOrderQuantity: number;
}

// ---------------------------------------------------------------------------
// Defaults — same values as DEFAULT_PRINTED_PRICING in the admin portal
// ---------------------------------------------------------------------------

export const DEFAULT_PRINTED_PRICING: PrintedPouchPricing = {
  combinations: {
    noWindowNonMetal: 3.0,
    noWindowMetal:    3.2,
    windowNonMetal:   3.5,
    windowMetal:      3.7,
  },
  capacityMultipliers: {
    '50g':  1.0,
    '100g': 1.1,
    '250g': 1.3,
    '500g': 1.6,
    '1kg':  2.0,
  },
  minOrderQuantity: 1000,
};

// ---------------------------------------------------------------------------
// Singleton in-memory cache + real-time Firestore subscription
// ---------------------------------------------------------------------------

const COLLECTION = 'printedPouchPricing';
const DOC_ID = 'current';

type Listener = (pricing: PrintedPouchPricing) => void;

let cachedPricing: PrintedPouchPricing = { ...DEFAULT_PRINTED_PRICING, combinations: { ...DEFAULT_PRINTED_PRICING.combinations } };
let listeners: Set<Listener> = new Set();
let unsubscribe: (() => void) | null = null;

function notify() {
  listeners.forEach((fn) => fn(cachedPricing));
}

function parseSnapshot(data: Record<string, unknown>): PrintedPouchPricing {
  // New schema: data.combinations is present
  if (data.combinations && typeof data.combinations === 'object') {
    const c = data.combinations as Partial<CombinationPrices>;
    return {
      combinations: {
        noWindowNonMetal: c.noWindowNonMetal ?? DEFAULT_PRINTED_PRICING.combinations.noWindowNonMetal,
        noWindowMetal:    c.noWindowMetal    ?? DEFAULT_PRINTED_PRICING.combinations.noWindowMetal,
        windowNonMetal:   c.windowNonMetal   ?? DEFAULT_PRINTED_PRICING.combinations.windowNonMetal,
        windowMetal:      c.windowMetal      ?? DEFAULT_PRINTED_PRICING.combinations.windowMetal,
      },
      capacityMultipliers: {
        ...DEFAULT_PRINTED_PRICING.capacityMultipliers,
        ...((data.capacityMultipliers as Partial<Record<Capacity, number>>) ?? {}),
      },
      minOrderQuantity: typeof data.minOrderQuantity === 'number'
        ? data.minOrderQuantity
        : DEFAULT_PRINTED_PRICING.minOrderQuantity,
    };
  }

  // Legacy schema: basePricePerPiece + windowAddon + metalisedAddon
  const base = typeof data.basePricePerPiece === 'number' ? data.basePricePerPiece : DEFAULT_PRINTED_PRICING.combinations.noWindowNonMetal;
  const win  = typeof data.windowAddon === 'number'       ? data.windowAddon : 0;
  const met  = typeof data.metalisedAddon === 'number'    ? data.metalisedAddon : 0;

  return {
    combinations: {
      noWindowNonMetal: base,
      noWindowMetal:    base + met,
      windowNonMetal:   base + win,
      windowMetal:      base + win + met,
    },
    capacityMultipliers: {
      ...DEFAULT_PRINTED_PRICING.capacityMultipliers,
      ...((data.capacityMultipliers as Partial<Record<Capacity, number>>) ?? {}),
    },
    minOrderQuantity: typeof data.minOrderQuantity === 'number'
      ? data.minOrderQuantity
      : DEFAULT_PRINTED_PRICING.minOrderQuantity,
  };
}

function ensureSubscription() {
  if (unsubscribe) return;

  const ref = doc(db, COLLECTION, DOC_ID);
  unsubscribe = onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        cachedPricing = parseSnapshot(snap.data() as Record<string, unknown>);
      } else {
        cachedPricing = { ...DEFAULT_PRINTED_PRICING, combinations: { ...DEFAULT_PRINTED_PRICING.combinations } };
      }
      notify();
    },
    (err) => {
      console.warn('[printedPouchPricing] Firestore listener error, using cached/default:', err);
    },
  );
}

export function subscribeToPrintedPricing(fn: Listener): () => void {
  ensureSubscription();
  listeners.add(fn);
  fn(cachedPricing);

  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };
}

export function getPrintedPricing(): PrintedPouchPricing {
  return cachedPricing;
}

// ---------------------------------------------------------------------------
// Price calculation
// ---------------------------------------------------------------------------

export interface PrintedPriceInput {
  windowOption: 'with' | 'without';
  materialType?: 'metalised' | 'non-metalised';
  capacity: Capacity;
  quantity: number;
}

/** Returns the combination key for a given window + material selection. */
export function getCombinationKey(
  windowOption: 'with' | 'without',
  materialType?: 'metalised' | 'non-metalised',
): keyof CombinationPrices {
  const hasWindow = windowOption === 'with';
  const isMetal = materialType === 'metalised';
  if (hasWindow && isMetal)   return 'windowMetal';
  if (hasWindow && !isMetal)  return 'windowNonMetal';
  if (!hasWindow && isMetal)  return 'noWindowMetal';
  return 'noWindowNonMetal';
}

/**
 * Calculate the total price for a printed pouch order using live Firestore pricing.
 */
export function calculatePrintedPrice(
  input: PrintedPriceInput,
  pricing: PrintedPouchPricing = cachedPricing,
): number {
  const comboKey = getCombinationKey(input.windowOption, input.materialType);
  const pricePerPiece = pricing.combinations[comboKey];
  const multiplier =
    pricing.capacityMultipliers[input.capacity] ??
    DEFAULT_PRINTED_PRICING.capacityMultipliers[input.capacity] ??
    1.0;

  return Math.round(pricePerPiece * multiplier * input.quantity);
}
