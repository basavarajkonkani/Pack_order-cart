import type { OrderItem, PouchType } from '@/types/firestore';

const POUCH_LABELS: Record<PouchType, string> = {
  plain: 'Plain Pouch',
  printed: 'Printed Pouch',
  kraft: 'Kraft Pouch',
};

/** Title to display for any order line item, custom or ready-stock. Mirrors the Buyer App's CartContext helper. */
export function getItemTitle(item: OrderItem): string {
  if (item.kind === 'stock') return item.productName ?? 'Stock Pouch';
  return POUCH_LABELS[item.pouchType ?? 'plain'];
}

/** Subtitle/spec line for any order line item, custom or ready-stock. */
export function getItemSpec(item: OrderItem): string {
  if (item.kind === 'stock') {
    return [item.sizeLabel, item.sizeWeight].filter(Boolean).join(' · ');
  }
  const windowText = item.windowOption === 'with' ? 'With Window' : 'No Window';
  // Kraft pouches are paper-based, so they carry no metalised / non-metalised spec.
  const materialText =
    item.pouchType === 'kraft' || !item.materialType
      ? null
      : item.materialType === 'metalised' ? 'Metalised' : 'Non-Metalised';
  return [windowText, materialText, item.capacity].filter(Boolean).join(' · ');
}
