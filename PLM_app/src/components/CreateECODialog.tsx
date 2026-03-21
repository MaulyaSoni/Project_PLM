import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useECOStore } from '@/stores/useECOStore';
import { useProductStore } from '@/stores/useProductStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Layers, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ECO, ECOType, ECOProductChange, ECOBOMComponentChange } from '@/data/mockData';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: ECOType;
  initialProductId?: string;
  initialBOMId?: string;
  initialTitle?: string;
  /** When provided, the dialog operates in edit mode, pre-filling fields from the ECO. */
  eco?: ECO;
}

export default function CreateECODialog({ open, onOpenChange, initialType, initialProductId, initialBOMId, initialTitle, eco: editEco }: Props) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ECOType | ''>('');
  const [productId, setProductId] = useState('');
  const [bomId, setBomId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [versionUpdate, setVersionUpdate] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product changes
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');

  // BOM changes
  const [bomChanges, setBomChanges] = useState<{ name: string; oldQty: string; newQty: string; changeType: string }[]>([]);

  const { createECO, updateECO } = useECOStore();
  const { products, fetchProducts } = useProductStore();
  const { boms, fetchBOMs } = useBOMStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Only fetch when dialog opens, and only if data isn't already loaded — prevents infinite loop
  // caused by Zustand store functions being recreated on every render causing the deps to always change
  useEffect(() => {
    if (!open) return;
    if (products.length === 0) fetchProducts();
    if (boms.length === 0) fetchBOMs();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;

    // Edit mode: pre-fill all fields from existing ECO
    if (editEco) {
      setTitle(editEco.title);
      setType(editEco.type);
      setProductId(editEco.productId);
      if (editEco.bomId) setBomId(editEco.bomId);
      setEffectiveDate(editEco.effectiveDate);
      setVersionUpdate(editEco.versionUpdate);
      if (editEco.type === 'PRODUCT' && editEco.productChanges) {
        const saleChange = editEco.productChanges.find(c => c.field === 'Sale Price');
        const costChange = editEco.productChanges.find(c => c.field === 'Cost Price');
        if (saleChange) setNewSalePrice(String(saleChange.newValue));
        if (costChange) setNewCostPrice(String(costChange.newValue));
      }
      if (editEco.type === 'BOM' && editEco.bomComponentChanges) {
        setBomChanges(editEco.bomComponentChanges.map(c => ({
          name: c.componentName,
          oldQty: c.oldQty !== null ? String(c.oldQty) : '0',
          newQty: c.newQty !== null ? String(c.newQty) : '',
          changeType: c.changeType,
        })));
      }
      return;
    }

    if (initialType) setType(initialType);
    if (initialTitle) setTitle(initialTitle);

    if (initialProductId) {
      handleProductSelect(initialProductId);
      setProductId(initialProductId);
    }

    if (initialBOMId) {
      handleBOMSelect(initialBOMId);
      setBomId(initialBOMId);
    }
  }, [open, initialType, initialProductId, initialBOMId, initialTitle, editEco]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedProduct = products.find(p => p.id === productId);
  const selectedBOM = boms.find(b => b.id === bomId);
  const filteredBOMs = boms.filter(b => b.productId === productId && b.status === 'ACTIVE');

  const resetForm = () => {
    setStep(1); setTitle(''); setType(''); setProductId(''); setBomId('');
    setEffectiveDate(''); setVersionUpdate(true); setConfirmed(false);
    setNewSalePrice(''); setNewCostPrice(''); setBomChanges([]);
    setIsSubmitting(false);
  };

  const isDirty =
    step > 1 ||
    !!title ||
    !!type ||
    !!productId ||
    !!bomId ||
    !!effectiveDate ||
    !versionUpdate ||
    !!newSalePrice ||
    !!newCostPrice ||
    bomChanges.length > 0;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!open || !isDirty || isSubmitting) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [open, isDirty, isSubmitting]);

  const handleProductSelect = (pid: string) => {
    setProductId(pid);
    setBomId('');
    const p = products.find(x => x.id === pid);
    if (p) { setNewSalePrice(String(p.salePrice)); setNewCostPrice(String(p.costPrice)); }
  };

  const handleBOMSelect = (bid: string) => {
    setBomId(bid);
    if (bid === 'NEW') {
      setBomChanges([]);
      return;
    }
    const b = boms.find(x => x.id === bid);
    if (b) {
      setBomChanges(b.components.map(c => ({ name: c.name, oldQty: String(c.quantity), newQty: String(c.quantity), changeType: 'UNCHANGED' })));
    }
  };

  const handleSubmit = async () => {
    if (!user || !type) return;
    if (isSubmitting) return;

    if (effectiveDate) {
      const selected = new Date(effectiveDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        toast.warning('Effective date is in the past');
      }
    }

    setIsSubmitting(true);
    let productChanges: ECOProductChange[] | undefined;
    let bomComponentChanges: ECOBOMComponentChange[] | undefined;

    if (type === 'PRODUCT' && selectedProduct) {
      productChanges = [
        { field: 'Sale Price', oldValue: selectedProduct.salePrice, newValue: Number(newSalePrice) },
        { field: 'Cost Price', oldValue: selectedProduct.costPrice, newValue: Number(newCostPrice) },
      ];
    }
    if (type === 'BOM') {
      bomComponentChanges = bomChanges.map(c => ({
        componentName: c.name,
        oldQty: c.changeType === 'ADDED' ? null : Number(c.oldQty),
        newQty: c.changeType === 'REMOVED' ? null : Number(c.newQty),
        changeType: c.changeType as 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED',
      }));
    }

    try {
      if (editEco) {
        await updateECO(editEco.id, {
          title, effectiveDate, versionUpdate, productChanges, bomComponentChanges,
        });
        toast.success('ECO updated');
        onOpenChange(false);
        resetForm();
      } else {
        const eco = await createECO({
          title, type, productId, productName: selectedProduct?.name || '',
          bomId: bomId || undefined, assignedTo: user.id, assignedToName: user.name,
          effectiveDate, versionUpdate, createdBy: user.id, createdByName: user.name,
          productChanges, bomComponentChanges,
        });
        toast.success('ECO created');
        onOpenChange(false);
        resetForm();
        navigate(`/ecos/${eco.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && isDirty && !isSubmitting) {
          const shouldClose = window.confirm('You have unsaved changes. Leave anyway?');
          if (!shouldClose) return;
        }
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{editEco ? 'Edit Engineering Change Order' : 'Create Engineering Change Order'}</DialogTitle></DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                s === step ? 'bg-primary text-primary-foreground' : s < step ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                {s}
              </div>
              {s < 3 && <div className={cn('w-8 h-0.5', s < step ? 'bg-success' : 'bg-border')} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ECO Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Describe the change..." className="bg-muted border-border" />
            </div>

            <div className="space-y-2">
              <Label>ECO Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['PRODUCT', 'BOM'] as const).map(t => (
                  <Card key={t} className={cn('cursor-pointer transition-all border-2', type === t ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground')} onClick={() => setType(t)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {t === 'PRODUCT' ? <Package className="h-8 w-8 text-primary" /> : <Layers className="h-8 w-8 text-primary" />}
                      <div>
                        <p className="font-medium">{t === 'PRODUCT' ? 'Product Changes' : 'BOM Structure Changes'}</p>
                        <p className="text-xs text-muted-foreground">{t === 'PRODUCT' ? 'Modify pricing or specs' : 'Change components or operations'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={productId} onValueChange={handleProductSelect}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.filter(p => p.status === 'ACTIVE').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {type === 'BOM' && productId && (
              <div className="space-y-2">
                <Label>BOM</Label>
                <Select value={bomId} onValueChange={handleBOMSelect}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select BOM" /></SelectTrigger>
                  <SelectContent>
                    {filteredBOMs.length === 0 && <SelectItem value="NEW">✨ Initialize New BOM</SelectItem>}
                    {filteredBOMs.length > 0 && <SelectItem value="NEW">✨ Create Alterate BOM</SelectItem>}
                    {filteredBOMs.map(b => <SelectItem key={b.id} value={b.id}>{b.productName} v{b.currentVersion}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="bg-muted border-border" />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Version Update</p>
                <p className={cn('text-xs', versionUpdate ? 'text-success' : 'text-warning')}>{versionUpdate ? 'Creates new version (recommended)' : 'Updates same version'}</p>
              </div>
              <Switch checked={versionUpdate} onCheckedChange={setVersionUpdate} />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!title || !type || !productId || (type === 'BOM' && !bomId)}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            {type === 'PRODUCT' && selectedProduct && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div><Label className="text-xs text-muted-foreground">Current Sale Price</Label><p className="text-lg font-mono text-muted-foreground">${selectedProduct.salePrice}</p></div>
                  <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="space-y-1"><Label>New Sale Price</Label><Input type="number" value={newSalePrice} onChange={e => setNewSalePrice(e.target.value)} className="bg-muted border-border" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div><Label className="text-xs text-muted-foreground">Current Cost Price</Label><p className="text-lg font-mono text-muted-foreground">${selectedProduct.costPrice}</p></div>
                  <div className="flex justify-center"><ArrowRight className="h-5 w-5 text-muted-foreground" /></div>
                  <div className="space-y-1"><Label>New Cost Price</Label><Input type="number" value={newCostPrice} onChange={e => setNewCostPrice(e.target.value)} className="bg-muted border-border" /></div>
                </div>
              </div>
            )}

            {type === 'BOM' && (
              <div className="space-y-3">
                <Label>Components</Label>
                {bomChanges.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={c.name} onChange={e => { const n = [...bomChanges]; n[i].name = e.target.value; setBomChanges(n); }} className="bg-muted border-border flex-1" readOnly={c.changeType !== 'ADDED'} />
                    <Input type="number" value={c.newQty} onChange={e => {
                      const n = [...bomChanges]; n[i].newQty = e.target.value;
                      n[i].changeType = e.target.value !== c.oldQty ? 'CHANGED' : 'UNCHANGED';
                      setBomChanges(n);
                    }} className="bg-muted border-border w-20" />
                    {c.changeType !== 'ADDED' && (
                      <Button variant="ghost" size="sm" onClick={() => { const n = [...bomChanges]; n[i].changeType = 'REMOVED'; n[i].newQty = ''; setBomChanges(n); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    {c.changeType === 'ADDED' && (
                      <Button variant="ghost" size="sm" onClick={() => setBomChanges(bomChanges.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setBomChanges([...bomChanges, { name: '', oldQty: '0', newQty: '', changeType: 'ADDED' }])}>
                  <Plus className="h-3 w-3 mr-1" />Add Component
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm"><span className="text-muted-foreground">Title:</span> {title}</p>
                <div className="text-sm flex items-center gap-2">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{type}</Badge>
                </div>
                <p className="text-sm"><span className="text-muted-foreground">Product:</span> {selectedProduct?.name}</p>
                <p className="text-sm"><span className="text-muted-foreground">Effective:</span> {effectiveDate}</p>
                {type === 'PRODUCT' && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm">Sale: ${selectedProduct?.salePrice} → <span className={Number(newSalePrice) > (selectedProduct?.salePrice || 0) ? 'text-success' : 'text-destructive'}>${newSalePrice}</span></p>
                    <p className="text-sm">Cost: ${selectedProduct?.costPrice} → <span className={Number(newCostPrice) > (selectedProduct?.costPrice || 0) ? 'text-success' : 'text-destructive'}>${newCostPrice}</span></p>
                  </div>
                )}
                {type === 'BOM' && bomChanges.filter(c => c.changeType !== 'UNCHANGED').length > 0 && (
                  <div className="mt-3 space-y-1">
                    {bomChanges.filter(c => c.changeType !== 'UNCHANGED').map((c, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs mr-2',
                          c.changeType === 'ADDED' && 'bg-success/15 text-success',
                          c.changeType === 'REMOVED' && 'bg-destructive/15 text-destructive',
                          c.changeType === 'CHANGED' && 'bg-warning/15 text-warning'
                        )}>{c.changeType}</Badge>
                        {c.name} {c.changeType === 'CHANGED' && `(${c.oldQty} → ${c.newQty})`}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={v => setConfirmed(!!v)} />
              <label htmlFor="confirm" className="text-sm">I confirm these changes are correct</label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} disabled={!confirmed || isSubmitting}>{isSubmitting ? 'Saving...' : (editEco ? 'Save Changes' : 'Submit ECO')}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
