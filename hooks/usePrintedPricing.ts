/**
 * hooks/usePrintedPricing.ts
 *
 * React hook that subscribes to live Printed Customized Pouch pricing from
 * Firestore. Returns the current pricing object and updates automatically
 * whenever the admin changes prices in the Admin Portal.
 *
 * Only used for `pouchType === 'printed'` screens.
 */

import { useEffect, useState } from 'react';
import {
  subscribeToPrintedPricing,
  DEFAULT_PRINTED_PRICING,
  type PrintedPouchPricing,
} from '@/lib/printedPouchPricing';

export function usePrintedPricing(): {
  pricing: PrintedPouchPricing;
  isLoaded: boolean;
} {
  const [pricing, setPricing] = useState<PrintedPouchPricing>(DEFAULT_PRINTED_PRICING);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsub = subscribeToPrintedPricing((p) => {
      setPricing(p);
      setIsLoaded(true);
    });
    return unsub;
  }, []);

  return { pricing, isLoaded };
}
