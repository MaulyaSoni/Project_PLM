import { Badge } from '@/components/ui/badge';
import type { ECOType } from '@/data/mockData';

export function TypeBadge({ type }: { type: ECOType }) {
  return type === 'PRODUCT'
    ? <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">Product</Badge>
    : <Badge variant="outline" className="bg-purple-500/15 text-purple-400 border-purple-500/30">BOM</Badge>;
}
