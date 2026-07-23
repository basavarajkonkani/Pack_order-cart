import type { PackagingRequestStatus } from '@/types/firestore';

export const PACKAGING_STATUS_CONFIG: Record<PackagingRequestStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#1d4ed8', bg: '#dbeafe' },
  in_review: { label: 'In Review', color: '#a16207', bg: '#fef9c3' },
  in_progress: { label: 'In Progress', color: '#c2410c', bg: '#ffedd5' },
  completed: { label: 'Completed', color: '#15803d', bg: '#dcfce7' },
  rejected: { label: 'Rejected', color: '#b91c1c', bg: '#fee2e2' },
};

export const PACKAGING_STATUS_OPTIONS: PackagingRequestStatus[] = [
  'new',
  'in_review',
  'in_progress',
  'completed',
  'rejected',
];
