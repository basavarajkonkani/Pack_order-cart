import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const PRINTED_PRICING_COLLECTION = 'printedPouchPricing';
export const PRINTED_PRICING_DOC_ID = 'current';

/**
 * Price per piece (₹) for each of the 4 window × material combinations.
 * Each is multiplied by the capacity multiplier × quantity to get the total.
 */
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
  /**
   * Price per piece for each window × material combination.
   * The capacity multiplier is applied on top of this.
   */
  combinations: CombinationPrices;
  /**
   * Multipliers applied to the per-piece price for each capacity.
   */
  capacityMultipliers: {
    '50g': number;
    '100g': number;
    '250g': number;
    '500g': number;
    '1kg': number;
  };
  /** Minimum order quantity for printed pouches */
  minOrderQuantity: number;
  updatedAt?: unknown;
}

export const DEFAULT_PRINTED_PRICING: Omit<PrintedPouchPricing, 'updatedAt'> = {
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
  minOrderQuantity: 5000,
};

export async function fetchPrintedPouchPricing(): Promise<PrintedPouchPricing> {
  const ref = doc(db, PRINTED_PRICING_COLLECTION, PRINTED_PRICING_DOC_ID);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULT_PRINTED_PRICING };
  const data = snap.data() as Partial<PrintedPouchPricing>;

  // Support legacy docs that still use basePricePerPiece + windowAddon + metalisedAddon
  const legacy = data as Record<string, unknown>;
  const base = typeof legacy.basePricePerPiece === 'number' ? legacy.basePricePerPiece as number : null;
  const win  = typeof legacy.windowAddon === 'number'       ? legacy.windowAddon as number : null;
  const met  = typeof legacy.metalisedAddon === 'number'    ? legacy.metalisedAddon as number : null;
  const legacyCombinations: CombinationPrices | null =
    base !== null && win !== null && met !== null
      ? {
          noWindowNonMetal: base,
          noWindowMetal:    base + met,
          windowNonMetal:   base + win,
          windowMetal:      base + win + met,
        }
      : null;

  return {
    combinations: {
      ...DEFAULT_PRINTED_PRICING.combinations,
      ...(legacyCombinations ?? {}),
      ...(data.combinations ?? {}),
    },
    capacityMultipliers: {
      ...DEFAULT_PRINTED_PRICING.capacityMultipliers,
      ...(data.capacityMultipliers ?? {}),
    },
    minOrderQuantity: data.minOrderQuantity ?? DEFAULT_PRINTED_PRICING.minOrderQuantity,
    updatedAt: data.updatedAt,
  };
}

export async function savePrintedPouchPricing(
  data: Omit<PrintedPouchPricing, 'updatedAt'>,
): Promise<void> {
  const ref = doc(db, PRINTED_PRICING_COLLECTION, PRINTED_PRICING_DOC_ID);
  // Save only the new schema — legacy fields are dropped
  await setDoc(ref, {
    combinations: data.combinations,
    capacityMultipliers: data.capacityMultipliers,
    minOrderQuantity: data.minOrderQuantity,
    updatedAt: serverTimestamp(),
  });
}
