import { useEffect, useState } from 'react';
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
import { Plus, Eye, GitPullRequest, Archive, Search, Package, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Product } from '@/data/mockData';
import CreateECODialog from '@/components/CreateECODialog';

export default function ProductsPage() {
  const { products, isLoading, fetchProducts, createProduct, archiveProduct } = useProductStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', salePrice: '', costPrice: '' });
  const [createEcoOpen, setCreateEcoOpen] = useState(false);
  const [ecoProductId, setEcoProductId] = useState<string>('');

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEERING';
  const canRaiseEco = user?.role === 'ENGINEERING';
  const canArchive = user?.role === 'ADMIN';

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = async () => {
    await createProduct({ name: newProduct.name, salePrice: Number(newProduct.salePrice), costPrice: Number(newProduct.costPrice) });
    setAddOpen(false);
    setNewProduct({ name: '', salePrice: '', costPrice: '' });
    toast.success('Product created');
  };

  const handleArchive = async () => {
    if (archiveTarget) {
      await archiveProduct(archiveTarget);
      setArchiveTarget(null);
      toast.success('Product archived');
    }
  };

  const handleRaiseEco = (product: Product) => {
    if (product.status === 'ARCHIVED') return;
    setEcoProductId(product.id);
    setCreateEcoOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in text-foreground pb-12">
      {/* Header section with Tagline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
            <Package className="h-3 w-3" /> Core Catalog
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Product Master Grid</h1>
          <p className="text-primary/90 tracking-wide font-medium italic">
            "Smart Product Management with Controlled Changes"
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-[0_0_20px_-5px_rgba(0,242,255,0.5)] border-0 h-11 px-6 whitespace-nowrap">
            <Plus className="h-5 w-5 mr-2" /> Initialize Product
          </Button>
        )}
      </div>

      {/* NIYANTRAK AI Info Banner */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-card border border-foreground/10 shadow-xl p-6">
          <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-primary h-5 w-5" />
              <h3 className="font-semibold text-lg text-foreground">What Does It Do?</h3>
            </div>
            <p className="text-foreground leading-relaxed mb-4 font-medium text-[15px]">
              NIYANTRAK AI manages products and their changes in a structured and controlled way. It enables secure, version-controlled, and approval-driven lifecycle changes.
            </p>
            <p className="text-foreground/80 leading-relaxed text-sm">
              Instead of allowing direct edits, it ensures that every modification goes through a proper approval process before being applied. It maintains version history, tracks changes, and ensures that only approved data is used in operations.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-card border border-foreground/10 shadow-xl p-6">
          <div className="absolute -bottom-24 -right-12 w-64 h-64 bg-success/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="text-success h-4 w-4" /> Core Advantages
            </h3>
            <ul className="space-y-2.5 text-sm text-foreground/90 font-medium">
              <li className="flex items-start gap-2"><span className="text-success select-none">✔</span> Prevents accidental data loss</li>
              <li className="flex items-start gap-2"><span className="text-success select-none">✔</span> Maintains complete version history</li>
              <li className="flex items-start gap-2"><span className="text-success select-none">✔</span> Only approved changes applied</li>
              <li className="flex items-start gap-2"><span className="text-success select-none">✔</span> Provides full traceability</li>
              <li className="flex items-start gap-2"><span className="text-success select-none">✔</span> Reduces risk in production</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap p-4 rounded-2xl bg-card/30 backdrop-blur-md border border-foreground/5 shadow-lg">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
          <Input
            placeholder="Search product nodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-11 h-12 bg-black/20 border-foreground/10 text-foreground placeholder:text-foreground/50 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
          />
        </div>
        <div className="flex bg-black/20 border border-foreground/10 rounded-xl p-1 h-12">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === s ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,242,255,0.2)]' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card/40 backdrop-blur-xl border border-foreground/5 shadow-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              message="No products found. Create your first product."
              icon={Package}
              actionLabel={canEdit ? 'Create Product' : undefined}
              onAction={canEdit ? () => setAddOpen(true) : undefined}
            />
          ) : (
            <Table>
              <TableHeader className="bg-foreground/[0.02]">
                <TableRow className="border-foreground/5 hover:bg-transparent">
                  <TableHead className="text-foreground font-semibold py-5 px-6 text-xs uppercase tracking-wider">Product Name</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Version</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Sale Price</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Cost Price</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-foreground font-semibold py-5 text-xs uppercase tracking-wider">Initialized</TableHead>
                  <TableHead className="text-right text-foreground font-semibold py-5 pr-6 text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="border-foreground/5 transition-colors hover:bg-foreground/[0.04] group">
                    <TableCell className="font-medium text-foreground px-6 py-4 text-base">{p.name}</TableCell>
                    <TableCell className="text-foreground/80 font-mono">v{p.currentVersion}</TableCell>
                    <TableCell className="text-foreground font-mono" title={canRaiseEco ? 'Raise an ECO to modify prices' : undefined}>${p.salePrice.toLocaleString()}</TableCell>
                    <TableCell className="text-foreground font-mono" title={canRaiseEco ? 'Raise an ECO to modify prices' : undefined}>${p.costPrice.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-foreground/70 text-sm font-mono">{p.createdAt}</TableCell>
                    <TableCell className="text-right pr-6 space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all" onClick={() => setDetailProduct(p)}><Eye className="h-4 w-4" /></Button>
                      {canRaiseEco && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button variant="ghost" size="icon" disabled={p.status === 'ARCHIVED'} onClick={() => handleRaiseEco(p)} className="h-8 w-8 text-foreground hover:text-foreground hover:bg-foreground/10 rounded-lg transition-all disabled:opacity-30">
                                <GitPullRequest className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-popover border-foreground/10 text-foreground">{p.status === 'ARCHIVED' ? 'Cannot raise ECO for archived product' : 'Raise an ECO to modify this product'}</TooltipContent>
                        </Tooltip>
                      )}
                      {canArchive && p.status === 'ACTIVE' && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all" onClick={() => setArchiveTarget(p.id)}><Archive className="h-4 w-4" /></Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Product Name</Label><Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} className="bg-muted border-border" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sale Price</Label><Input type="number" value={newProduct.salePrice} onChange={e => setNewProduct(p => ({ ...p, salePrice: e.target.value }))} className="bg-muted border-border" /></div>
              <div className="space-y-2"><Label>Cost Price</Label><Input type="number" value={newProduct.costPrice} onChange={e => setNewProduct(p => ({ ...p, costPrice: e.target.value }))} className="bg-muted border-border" /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newProduct.name}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer */}
      <Sheet open={!!detailProduct} onOpenChange={() => setDetailProduct(null)}>
        <SheetContent className="bg-card border-border w-[480px] sm:max-w-[480px]">
          <SheetHeader><SheetTitle>{detailProduct?.name}</SheetTitle></SheetHeader>
          {detailProduct && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-3">Version History</h4>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Version</TableHead><TableHead>Sale</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailProduct.versions.map(v => (
                    <TableRow key={v.version} className={`border-border ${v.status === 'ACTIVE' ? 'bg-success/5' : ''}`}>
                      <TableCell>v{v.version}</TableCell>
                      <TableCell>${v.salePrice}</TableCell>
                      <TableCell>${v.costPrice}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {canRaiseEco && detailProduct.status !== 'ARCHIVED' && (
                <div className="mt-4">
                  <Button className="w-full" onClick={() => handleRaiseEco(detailProduct)}>
                    <GitPullRequest className="h-4 w-4 mr-2" />Raise ECO for this Product
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CreateECODialog
        open={createEcoOpen}
        onOpenChange={setCreateEcoOpen}
        initialType="PRODUCT"
        initialProductId={ecoProductId || undefined}
      />

      <ConfirmDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)} title="Archive Product" description="Are you sure? This will mark the product as archived." confirmLabel="Archive" variant="destructive" onConfirm={handleArchive} />
    </div>
  );
}
