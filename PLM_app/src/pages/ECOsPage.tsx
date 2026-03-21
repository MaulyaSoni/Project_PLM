import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Pencil, Trash2, Search, GitPullRequest, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import CreateECODialog from '@/components/CreateECODialog';

export default function ECOsPage() {
  const { ecos, isLoading, fetchECOs, deleteECO } = useECOStore();
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteECO(deleteTarget);
    setDeleteTarget(null);
    toast.success('ECO deleted successfully.');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in text-foreground pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-semibold uppercase tracking-widest mb-3">
            <GitPullRequest className="h-3 w-3" /> Change Control
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">Engineering Change Orders</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Track, approve, and deploy architectural modifications across the product infrastructure.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,242,255,0.5)] border-0 h-11 px-6 whitespace-nowrap">
            <Plus className="h-5 w-5 mr-2" /> Initialize ECO
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap p-4 rounded-2xl bg-card/30 backdrop-blur-md border border-white/5 shadow-lg">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ECO directives..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 h-12 bg-black/20 border-white/10 text-white placeholder:text-muted-foreground/70 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/20 border border-white/10 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-12 bg-black/20 border-white/10 text-white rounded-xl focus:ring-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              <SelectItem value="ALL">All Schemas</SelectItem>
              <SelectItem value="PRODUCT">Product Link</SelectItem>
              <SelectItem value="BOM">BOM Link</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-12 bg-black/20 border-white/10 text-white rounded-xl focus:ring-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-white/10">
              <SelectItem value="ALL">All States</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="DONE">Deployed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-24">
              <EmptyState
                message="No ECOs found. Create your first ECO."
                icon={GitPullRequest}
                actionLabel={canCreate ? 'Create ECO' : undefined}
                onAction={canCreate ? () => setCreateOpen(true) : undefined}
              />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium py-5 px-6 text-xs uppercase tracking-wider">Designation</TableHead>
                  <TableHead className="text-muted-foreground font-medium py-5 text-xs uppercase tracking-wider">Schema</TableHead>
                  <TableHead className="text-muted-foreground font-medium py-5 text-xs uppercase tracking-wider">Target Entity</TableHead>
                  <TableHead className="text-muted-foreground font-medium py-5 text-xs uppercase tracking-wider">Controller</TableHead>
                  <TableHead className="text-muted-foreground font-medium py-5 text-xs uppercase tracking-wider">State</TableHead>
                  <TableHead className="text-muted-foreground font-medium py-5 text-xs uppercase tracking-wider">Effective Cycle</TableHead>
                  <TableHead className="text-right text-muted-foreground font-medium py-5 pr-6 text-xs uppercase tracking-wider">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(eco => (
                  <TableRow key={eco.id} className="border-white/5 transition-colors hover:bg-white/[0.03] group">
                    <TableCell className="font-medium py-4 px-6">
                      <Link to={`/ecos/${eco.id}`} className="text-white group-hover:text-primary transition-colors underline-offset-4 text-base">{eco.title}</Link>
                    </TableCell>
                    <TableCell><TypeBadge type={eco.type} /></TableCell>
                    <TableCell className="text-muted-foreground">{eco.productName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                        {eco.assignedToName}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={eco.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{eco.effectiveDate}</TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-all" asChild>
                        <Link to={`/ecos/${eco.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      {eco.status === 'NEW' && eco.createdBy === user?.id && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-all">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {eco.status !== 'NEW' && (
                        <Badge variant="outline" className="text-xs">Locked</Badge>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all" onClick={() => setDeleteTarget(eco.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {createOpen && <CreateECODialog open={createOpen} onOpenChange={setCreateOpen} />}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Purge Change Directive"
        description="This action will permanently purge the ECO from the Forge Matrix. This cannot be undone."
        confirmLabel="Purge Directive"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
