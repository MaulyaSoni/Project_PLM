import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Pencil, Trash2, Search, GitPullRequest } from 'lucide-react';
import { toast } from 'sonner';
import CreateECODialog from '@/components/CreateECODialog';

export default function ECOsPage() {
  const { ecos, isLoading, fetchECOs } = useECOStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'ENGINEERING';
  const canDelete = user?.role === 'ADMIN';

  useEffect(() => { fetchECOs(); }, [fetchECOs]);

  const filtered = ecos.filter(e => {
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = () => {
    setDeleteTarget(null);
    toast.success('ECO deleted');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Engineering Change Orders"
        action={canCreate ? <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Create ECO</Button> : undefined}
      />

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search ECOs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-border" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PRODUCT">Product</SelectItem>
            <SelectItem value="BOM">BOM</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-muted border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="IN_REVIEW">In Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? <EmptyState message="No ECOs found" icon={GitPullRequest} /> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Product</TableHead><TableHead>Assigned To</TableHead><TableHead>Status</TableHead><TableHead>Effective</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(eco => (
                  <TableRow key={eco.id} className="border-border">
                    <TableCell className="font-medium">
                      <Link to={`/ecos/${eco.id}`} className="hover:text-primary">{eco.title}</Link>
                    </TableCell>
                    <TableCell><TypeBadge type={eco.type} /></TableCell>
                    <TableCell className="text-muted-foreground">{eco.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{eco.assignedToName}</TableCell>
                    <TableCell><StatusBadge status={eco.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{eco.effectiveDate}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{eco.createdAt}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" asChild><Link to={`/ecos/${eco.id}`}><Eye className="h-4 w-4" /></Link></Button>
                      {eco.status === 'NEW' && eco.createdBy === user?.id && <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>}
                      {canDelete && <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(eco.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateECODialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete ECO" description="This action cannot be undone." confirmLabel="Delete" variant="destructive" onConfirm={handleDelete} />
    </div>
  );
}
