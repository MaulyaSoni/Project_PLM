import { useEffect, useState } from 'react';
import { useBOMStore } from '@/stores/useBOMStore';
import { useProductStore } from '@/stores/useProductStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, GitPullRequest, Archive, Search, Layers, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BOM, BOMComponent, BOMOperation } from '@/data/mockData';

export default function BOMsPage() {
  const { boms, isLoading, fetchBOMs, createBOM, archiveBOM } = useBOMStore();
  const { products, fetchProducts } = useProductStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [detailBOM, setDetailBOM] = useState<BOM | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  // New BOM form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [components, setComponents] = useState<{ name: string; quantity: string; unit: string }[]>([{ name: '', quantity: '', unit: 'pcs' }]);
  const [operations, setOperations] = useState<{ name: string; duration: string; workCenter: string }[]>([{ name: '', duration: '', workCenter: '' }]);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEERING';
  const canArchive = user?.role === 'ADMIN';

  useEffect(() => { fetchBOMs(); fetchProducts(); }, [fetchBOMs, fetchProducts]);

  const filtered = boms.filter(b => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (search && !b.productName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    const comps: BOMComponent[] = components.filter(c => c.name).map((c, i) => ({ id: 'nc' + i, name: c.name, quantity: Number(c.quantity), unit: c.unit }));
    const ops: BOMOperation[] = operations.filter(o => o.name).map((o, i) => ({ id: 'no' + i, name: o.name, duration: Number(o.duration), workCenter: o.workCenter }));
    await createBOM({ productId: product.id, productName: product.name, components: comps, operations: ops });
    setAddOpen(false);
    resetForm();
    toast.success('BOM created');
  };

  const resetForm = () => {
    setSelectedProduct('');
    setComponents([{ name: '', quantity: '', unit: 'pcs' }]);
    setOperations([{ name: '', duration: '', workCenter: '' }]);
  };

  const handleArchive = async () => {
    if (archiveTarget) { await archiveBOM(archiveTarget); setArchiveTarget(null); toast.success('BOM archived'); }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Bills of Materials" action={canEdit ? <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add BOM</Button> : undefined} />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-border" />
        </div>
        <div className="flex bg-muted rounded-md p-0.5">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${statusFilter === s ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? <EmptyState message="No BOMs found" icon={Layers} /> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Product</TableHead><TableHead>Version</TableHead><TableHead>Components</TableHead><TableHead>Operations</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className="border-border">
                    <TableCell className="font-medium">{b.productName}</TableCell>
                    <TableCell className="text-muted-foreground">v{b.currentVersion}</TableCell>
                    <TableCell>{b.components.length}</TableCell>
                    <TableCell>{b.operations.length}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{b.createdAt}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailBOM(b)}><Eye className="h-4 w-4" /></Button>
                      {canEdit && <Button variant="ghost" size="sm" disabled={b.status === 'ARCHIVED'}><GitPullRequest className="h-4 w-4" /></Button>}
                      {canArchive && b.status === 'ACTIVE' && <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(b.id)}><Archive className="h-4 w-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={!!detailBOM} onOpenChange={() => setDetailBOM(null)}>
        <SheetContent className="bg-card border-border w-[560px] sm:max-w-[560px]">
          <SheetHeader><SheetTitle>{detailBOM?.productName} — BOM</SheetTitle></SheetHeader>
          {detailBOM && (
            <Tabs defaultValue="components" className="mt-4">
              <TabsList className="bg-muted">
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
              </TabsList>
              <TabsContent value="components">
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Component</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead></TableRow></TableHeader>
                  <TableBody>{detailBOM.components.map(c => (<TableRow key={c.id} className="border-border"><TableCell>{c.name}</TableCell><TableCell>{c.quantity}</TableCell><TableCell>{c.unit}</TableCell></TableRow>))}</TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="operations">
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Operation</TableHead><TableHead>Duration</TableHead><TableHead>Work Center</TableHead></TableRow></TableHeader>
                  <TableBody>{detailBOM.operations.map(o => (<TableRow key={o.id} className="border-border"><TableCell>{o.name}</TableCell><TableCell>{o.duration} mins</TableCell><TableCell>{o.workCenter}</TableCell></TableRow>))}</TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="versions">
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>{detailBOM.versions.map(v => (<TableRow key={v.version} className={`border-border ${v.status === 'ACTIVE' ? 'bg-success/5' : ''}`}><TableCell>v{v.version}</TableCell><TableCell><StatusBadge status={v.status} /></TableCell><TableCell className="text-sm text-muted-foreground">{v.createdAt}</TableCell></TableRow>))}</TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>

      {/* Add BOM Dialog */}
      <Dialog open={addOpen} onOpenChange={v => { if (!v) resetForm(); setAddOpen(v); }}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Bill of Materials</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.filter(p => p.status === 'ACTIVE').map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Components</Label>
              {components.map((c, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input placeholder="Name" value={c.name} onChange={e => { const n = [...components]; n[i].name = e.target.value; setComponents(n); }} className="bg-muted border-border" />
                  <Input placeholder="Qty" type="number" value={c.quantity} onChange={e => { const n = [...components]; n[i].quantity = e.target.value; setComponents(n); }} className="bg-muted border-border w-20" />
                  {components.length > 1 && <Button variant="ghost" size="sm" onClick={() => setComponents(components.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setComponents([...components, { name: '', quantity: '', unit: 'pcs' }])}><Plus className="h-3 w-3 mr-1" />Add Row</Button>
            </div>
            <div>
              <Label>Operations</Label>
              {operations.map((o, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <Input placeholder="Name" value={o.name} onChange={e => { const n = [...operations]; n[i].name = e.target.value; setOperations(n); }} className="bg-muted border-border" />
                  <Input placeholder="Mins" type="number" value={o.duration} onChange={e => { const n = [...operations]; n[i].duration = e.target.value; setOperations(n); }} className="bg-muted border-border w-20" />
                  <Input placeholder="Work Center" value={o.workCenter} onChange={e => { const n = [...operations]; n[i].workCenter = e.target.value; setOperations(n); }} className="bg-muted border-border" />
                  {operations.length > 1 && <Button variant="ghost" size="sm" onClick={() => setOperations(operations.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setOperations([...operations, { name: '', duration: '', workCenter: '' }])}><Plus className="h-3 w-3 mr-1" />Add Row</Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { resetForm(); setAddOpen(false); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!selectedProduct}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)} title="Archive BOM" description="Are you sure you want to archive this BOM?" confirmLabel="Archive" variant="destructive" onConfirm={handleArchive} />
    </div>
  );
}
