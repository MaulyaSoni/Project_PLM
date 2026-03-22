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
            <Layers className="h-3 w-3" /> Architecture Matrix
          </div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground mb-2 shadow-primary/20 drop-shadow-lg">Bills of Materials</h1>
          <p className="text-success/90 tracking-wide font-medium italic">
            "Smart Product Structure with Controlled Dependencies"
          </p>
        </div>
        {canEdit && <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,242,255,0.5)] border-0 h-11 px-6 whitespace-nowrap rounded-2xl transition-all duration-300 transform hover:scale-105"><Plus className="h-5 w-5 mr-2" /> Initialize BOM Blueprint</Button>}
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="relative overflow-hidden rounded-[2rem] bg-card/60 backdrop-blur-3xl border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_0_rgba(157,255,0,0.15)] transition-all duration-500 p-8 group">
          <div className="absolute -top-24 -left-12 w-64 h-64 bg-success/15 rounded-full blur-[80px] pointer-events-none group-hover:bg-success/25 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20">
                <Cpu className="text-secondary h-6 w-6" />
              </div>
              <h3 className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/60">Immutable Matrix</h3>
            </div>
            <p className="text-foreground/70 leading-relaxed font-medium text-[16px]">
              Guaranteed data integrity, traceability, and operational clarity across your entire assembly tree with rigorous access controls and version locking mechanisms.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-card/60 backdrop-blur-3xl border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_0_rgba(255,77,77,0.15)] transition-all duration-500 p-8 group">
          <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-primary/15 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/25 transition-all duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-center">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-warning/10 border border-warning/20">
                <ShieldAlert className="text-warning h-6 w-6" />
              </div>
              <h3 className="font-display font-black text-2xl text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/50">Controlled Revisions</h3>
            </div>
            <p className="text-foreground/70 leading-relaxed font-medium text-[16px]">
              Engineering Change Orders (ECOs) are the sole gatekeeper for architectural changes, cementing a resilient and fault-tolerant release management structure.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap p-4 rounded-[2rem] bg-card/30 backdrop-blur-2xl border border-white/5 shadow-xl">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search architecture matrix..." value={search} onChange={e => setSearch(e.target.value)} className="pl-12 h-14 bg-background/40 border-white/5 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-2xl text-base shadow-inner" />
        </div>
        <div className="flex bg-background/40 border border-white/5 rounded-2xl p-1.5 h-14 items-center">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${statusFilter === s ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>{s === 'ALL' ? 'Global States' : s === 'ACTIVE' ? 'Active Trees' : 'Vaulted'}</button>
          ))}
        </div>
      </div>

      <Card className="bg-card/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-24">
              <EmptyState message="No BOM hierarchies found. Initialize the matrix." icon={Layers} actionLabel={canEdit ? 'Initialize BOM Matrix' : undefined} onAction={canEdit ? () => setAddOpen(true) : undefined} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5 h-14">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-semibold py-5 px-6 text-xs uppercase tracking-widest">Architecture</TableHead>
                    <TableHead className="text-muted-foreground font-semibold py-5 text-xs uppercase tracking-widest">Revision</TableHead>
                    <TableHead className="text-muted-foreground font-semibold py-5 text-xs uppercase tracking-widest">Components</TableHead>
                    <TableHead className="text-muted-foreground font-semibold py-5 text-xs uppercase tracking-widest">Operations</TableHead>
                    <TableHead className="text-muted-foreground font-semibold py-5 text-xs uppercase tracking-widest">State</TableHead>
                    <TableHead className="text-muted-foreground font-semibold py-5 text-xs uppercase tracking-widest">Initialized</TableHead>
                    <TableHead className="text-right text-muted-foreground font-semibold py-5 pr-6 text-xs uppercase tracking-widest">Matrix Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(b => (
                    <TableRow key={b.id} className="border-white/5 transition-all duration-300 hover:bg-white/5 group">
                      <TableCell className="font-display font-medium text-foreground px-6 py-5 text-lg">{b.productName}</TableCell>
                      <TableCell className="text-primary font-mono bg-primary/10 px-3 py-1 rounded-lg w-max ml-1 mt-3 inline-block font-semibold">v{b.currentVersion}.0</TableCell>
                      <TableCell className="text-foreground font-mono">{b.components.length} node{b.components.length !== 1 && 's'}</TableCell>
                      <TableCell className="text-foreground font-mono">{b.operations.length} step{b.operations.length !== 1 && 's'}</TableCell>
                      <TableCell><StatusBadge status={b.status} /></TableCell>
                      <TableCell className="text-foreground/50 text-sm font-mono">{b.createdAt}</TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/15 rounded-xl transition-all" onClick={() => setDetailBOM(b)}><Eye className="h-5 w-5" /></Button>
                        {canRaiseEco && <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-warning hover:bg-warning/15 rounded-xl transition-all disabled:opacity-30" disabled={b.status === 'ARCHIVED'} onClick={() => handleRaiseEco(b)}><GitPullRequest className="h-5 w-5" /></Button>}
                        {canArchive && b.status === 'ACTIVE' && <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-xl transition-all" onClick={() => setArchiveTarget(b.id)}><Archive className="h-5 w-5" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
