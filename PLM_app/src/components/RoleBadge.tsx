import { Badge } from '@/components/ui/badge';
import type { Role } from '@/data/mockData';

const roleConfig: Record<Role, { className: string }> = {
  ADMIN: { className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  ENGINEERING: { className: 'bg-primary/15 text-primary border-primary/30' },
  APPROVER: { className: 'bg-warning/15 text-warning border-warning/30' },
  OPERATIONS: { className: 'bg-muted/60 text-muted-foreground border-muted' },
};

export function RoleBadge({ role }: { role: Role }) {
  const config = roleConfig[role];
  return <Badge variant="outline" className={config.className}>{role}</Badge>;
}
