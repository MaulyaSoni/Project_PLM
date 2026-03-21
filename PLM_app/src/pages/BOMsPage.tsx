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
import { Plus, Eye, GitPullRequest, Archive, Search, Layers, Trash2, Cpu, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { BOM, BOMComponent, BOMOperation } from '@/data/mockData';
import CreateECODialog from '@/components/CreateECODialog';

export default function BOMsPage() {
  const { boms, isLoading, fetchBOMs, createBOM, archiveBOM } = useBOMStore();
  const { products, fetchProducts } = useProductStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [detailBOM, setDetailBOM] = useState<BOM | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [createEcoOpen, setCreateEcoOpen] = useState(false);
  const [ecoBOMTarget, setEcoBOMTarget] = useState<{ productId: string; bomId: string } | null>(null);

  // New BOM form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [components, setComponents] = useState<{ name: string; quantity: string; unit: string }[]>([{ name: '', quantity: '', unit: 'pcs' }]);
  const [operations, setOperations] = useState<{ name: string; duration: string; workCenter: string }[]>([{ name: '', duration: '', workCenter: '' }]);

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEERING';
  const canRaiseEco = user?.role === 'ENGINEERING';
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

  const handleRaiseEco = (bom: BOM) => {
    if (bom.status === 'ARCHIVED') return;
    setEcoBOMTarget({ productId: bom.productId, bomId: bom.id });
    setCreateEcoOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in text-foreground pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold uppercase tracking-widest mb-3">
            <Layers className="h-3 w-3" /> Architecture
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-2">Bills of Materials</h1>
          <p className="text-success/90 tracking-wide font-medium italic">
            "Smart Product Structure with Controlled Dependencies"
          </p>
        </div>
        {canEdit && <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,242,255,0.5)] border-0 h-11 px-6 whitespace-nowrap"><Plus className="h-5 w-5 mr-2" /> Initialize BOM</Button>}
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="relative overflow-hidden rounded-2xl bg-card border border-foreground/10 shadow-xl p-6">
          <div className="absolute -top-24 -left-12 w-64 h-64 bg-success/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="text-secondary h-5 w-5" />
              <h3 className="font-display font-bold text-lg text-foreground">Immutable Operations</h3>
            </div>
            <p className="text-foreground/90 leading-relaxed font-medium text-[15px]">
              It ensures data integrity, traceability, and reliable operations by preventing direct modifications and enforcing a structured change workflow on manufacturing components.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-foreground/10 shadow-xl p-6">
          <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="text-warning h-5 w-5" />
              <h3 className="font-display font-bold text-lg text-foreground">Controlled Revisions</h3>
            </div>
            <p className="text-foreground/90 leading-relaxed font-medium text-[15px]">
              Instead of allowing ad-hoc component swapping, this module locks down dependency hierarchies until an Engineering Change Order (ECO) fully resolves.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap p-4 rounded-2xl bg-card/30 backdrop-blur-md border border-foreground/5 shadow-lg">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <Input placeholder="Search by product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-11 h-12 bg-black/20 border-foreground/10 text-foreground placeholder:text-foreground/50 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl" />
        </div>
        <div className="flex bg-black/20 border border-foreground/10 rounded-xl p-1 h-12">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === s ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}>{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
          ))}
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border border-foreground/5 shadow-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-24">
              <EmptyState message="No BOMs found. Create your first BOM architecture." icon={Layers} actionLabel={canEdit ? 'Initialize BOM' : undefined} onAction={canEdit ? () => setAddOpen(true) : undefined} />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-foreground/[0.02]">
                <TableRow className="border-foreground/5 hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold py-5 px-6 text-xs uppercase tracking-wider">Product</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Components</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Operations</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Initialized</TableHead>
                  <TableHead className="text-right text-foreground font-semibold py-5 pr-6 text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} className="border-foreground/5 transition-colors hover:bg-foreground/[0.04] group">
                    <TableCell className="font-medium text-foreground px-6 py-4 text-base">{b.productName}</TableCell>
                    <TableCell className="text-foreground/80 font-mono">v{b.currentVersion}</TableCell>
                    <TableCell className="text-foreground font-mono">{b.components.length}</TableCell>
                    <TableCell className="text-foreground font-mono">{b.operations.length}</TableCell>
                    <TableCell><StatusBadge status={b.status} /></TableCell>
                    <TableCell className="text-foreground/70 text-sm font-mono">{b.createdAt}</TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all" onClick={() => setDetailBOM(b)}><Eye className="h-4 w-4" /></Button>
                      {canRaiseEco && <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all disabled:opacity-30" disabled={b.status === 'ARCHIVED'} onClick={() => handleRaiseEco(b)}><GitPullRequest className="h-4 w-4" /></Button>}
                      {canArchive && b.status === 'ACTIVE' && <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all" onClick={() => setArchiveTarget(b.id)}><Archive className="h-4 w-4" /></Button>}
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

      <CreateECODialog
        open={createEcoOpen}
        onOpenChange={setCreateEcoOpen}
        initialType="BOM"
        initialProductId={ecoBOMTarget?.productId}
        initialBOMId={ecoBOMTarget?.bomId}
      />

      <ConfirmDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)} title="Archive BOM" description="Are you sure you want to archive this BOM?" confirmLabel="Archive" variant="destructive" onConfirm={handleArchive} />
    </div>
  );
}
