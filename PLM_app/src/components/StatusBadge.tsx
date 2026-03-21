import { Badge } from '@/components/ui/badge';
import type { ECOStatus, ProductStatus } from '@/data/mockData';

const statusConfig: Record<string, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'bg-muted/60 text-muted-foreground border-muted' },
  IN_REVIEW: { label: 'In Review', className: 'bg-warning/15 text-warning border-warning/30' },
  APPROVED: { label: 'Approved', className: 'bg-success/15 text-success border-success/30' },
  DONE: { label: 'Done', className: 'bg-primary/15 text-primary border-primary/30' },
  ACTIVE: { label: 'Active', className: 'bg-success/15 text-success border-success/30' },
  ARCHIVED: { label: 'Archived', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  REJECTED: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export function StatusBadge({ status }: { status: ECOStatus | ProductStatus | string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}
