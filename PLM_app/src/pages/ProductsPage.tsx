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
import { Plus, Eye, GitPullRequest, Archive, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Product } from '@/data/mockData';

export default function ProductsPage() {
  const { products, isLoading, fetchProducts, createProduct, archiveProduct } = useProductStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', salePrice: '', costPrice: '' });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'ENGINEERING';
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

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Product Master"
        subtitle="Manage your product catalog"
        action={canEdit ? <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Product</Button> : undefined}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-border" />
        </div>
        <div className="flex bg-muted rounded-md p-0.5">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${statusFilter === s ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? <EmptyState message="No products found" icon={Package} /> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Product Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">v{p.currentVersion}</TableCell>
                    <TableCell>${p.salePrice.toLocaleString()}</TableCell>
                    <TableCell>${p.costPrice.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.createdAt}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => setDetailProduct(p)}><Eye className="h-4 w-4" /></Button>
                      {canEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button variant="ghost" size="sm" disabled={p.status === 'ARCHIVED'}>
                                <GitPullRequest className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{p.status === 'ARCHIVED' ? 'Cannot raise ECO for archived product' : 'Raise an ECO to modify this product'}</TooltipContent>
                        </Tooltip>
                      )}
                      {canArchive && p.status === 'ACTIVE' && (
                        <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(p.id)}><Archive className="h-4 w-4 text-destructive" /></Button>
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
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)} title="Archive Product" description="Are you sure? This will mark the product as archived." confirmLabel="Archive" variant="destructive" onConfirm={handleArchive} />
    </div>
  );
}
