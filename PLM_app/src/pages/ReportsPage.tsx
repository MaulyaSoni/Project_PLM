import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, BarChart3, Archive, Grid2x2 } from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { useProductStore } from '@/stores/useProductStore';
import type { ECO, ProductVersion, AuditEntry } from '@/data/mockData';

const actionColors: Record<string, string> = {
  CREATE: 'bg-primary/15 text-primary border-primary/30',
  UPDATE: 'bg-warning/15 text-warning border-warning/30',
  APPROVE: 'bg-success/15 text-success border-success/30',
  REJECT: 'bg-destructive/15 text-destructive border-destructive/30',
  ARCHIVE: 'bg-muted/60 text-muted-foreground border-muted',
};

type ArchivedProduct = {
  id: string;
  name: string;
  totalVersions: number;
  lastVersion: number | null;
  finalSalePrice: number | null;
  finalCostPrice: number | null;
  createdAt: string;
  versions: ProductVersion[];
  archivedVia: { id: string; title: string } | null;
};

type MatrixRow = {
  productId: string;
  productName: string;
  productStatus: string;
  activeVersion: { version: number; salePrice: number; costPrice: number } | null;
  activeBOM: {
    version: number;
    components: Array<{ id: string; componentName: string; quantity: number; unit: string }>;
    operations: Array<{ id: string; name: string; duration: number; workCenter: string }>;
  } | null;
  hasVersion: boolean;
  hasBOM: boolean;
  isComplete: boolean;
  componentCount: number;
  operationCount: number;
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const { products, fetchProducts } = useProductStore();
  const [ecoReport, setEcoReport] = useState<ECO[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [bomHistory, setBomHistory] = useState<ECO[]>([]);
  const [archivedProducts, setArchivedProducts] = useState<ArchivedProduct[]>([]);
  const [activeMatrix, setActiveMatrix] = useState<MatrixRow[]>([]);
  const [changesOpen, setChangesOpen] = useState(false);
  const [selectedEco, setSelectedEco] = useState<ECO | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedArchivedProduct, setSelectedArchivedProduct] = useState<ArchivedProduct | null>(null);
  const [expandedMatrix, setExpandedMatrix] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    reportsService.getECOReport().then(setEcoReport);
    reportsService.getAuditLog().then(setAuditLog);
    reportsService.getArchivedProducts().then(setArchivedProducts);
    reportsService.getActiveMatrix().then(setActiveMatrix);
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProduct) {
      reportsService.getVersionHistory(selectedProduct).then(setVersions);
      reportsService.getBOMHistory(selectedProduct).then(setBomHistory);
    } else {
      setVersions([]);
      setBomHistory([]);
    }
  }, [selectedProduct]);

  const openChangesModal = (eco: ECO) => {
    setSelectedEco(eco);
    setChangesOpen(true);
  };

  const matrixSummary = useMemo(() => {
    const total = activeMatrix.length;
    const withBom = activeMatrix.filter((r) => r.hasBOM).length;
    const withoutBom = activeMatrix.filter((r) => !r.hasBOM).length;
    const complete = activeMatrix.filter((r) => r.isComplete).length;
    return { total, withBom, withoutBom, complete };
  }, [activeMatrix]);

  const getMatrixStatus = (row: MatrixRow) => {
    if (row.hasVersion && row.hasBOM) return { label: 'Complete', cls: 'bg-success/15 text-success border-success/30' };
    if (!row.hasVersion && !row.hasBOM) return { label: 'Incomplete', cls: 'bg-destructive/15 text-destructive border-destructive/30' };
    if (!row.hasVersion) return { label: 'Missing Version', cls: 'bg-warning/15 text-warning border-warning/30' };
    return { label: 'Missing BOM', cls: 'bg-warning/15 text-warning border-warning/30' };
  };

  const splitBomChanges = (eco: ECO) => {
    const changes = eco.bomComponentChanges || [];
    const componentChanges = changes.filter((c) => !String(c.componentName || '').startsWith('OP_'));
    const operationChanges = changes.filter((c) => String(c.componentName || '').startsWith('OP_'));
    return { componentChanges, operationChanges };
  };

  return (
    <div className="animate-fade-in print:bg-white print:text-black">
      <div className="print:hidden">
        <PageHeader title="Reports & Audit Trail" />
      </div>

      <Tabs defaultValue="eco" className="space-y-4">
        <TabsList className="bg-muted print:hidden">
          <TabsTrigger value="eco">ECO Report</TabsTrigger>
          <TabsTrigger value="product">Product Versions</TabsTrigger>
          <TabsTrigger value="bom">BOM History</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="archived">Archived Products</TabsTrigger>
          <TabsTrigger value="matrix">Product-Version-BOM Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="eco">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-border print:border-b-black">
                <h3 className="font-semibold text-lg print:text-2xl print:mb-4">Engineering Change Orders Report</h3>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden"><Download className="h-4 w-4 mr-2" />Export PDF</Button>
              </div>
              {ecoReport.length === 0 ? <EmptyState message="No ECO data" icon={BarChart3} /> : (
                <Table className="print:w-full print:border-collapse">
                  <TableHeader><TableRow className="border-border hover:bg-transparent print:border-b-2 print:border-black"><TableHead className="print:text-black">Title</TableHead><TableHead className="print:text-black">Type</TableHead><TableHead className="print:text-black">Product</TableHead><TableHead className="print:text-black">Changes</TableHead><TableHead className="print:text-black">Stage</TableHead><TableHead className="print:text-black">Status</TableHead><TableHead className="print:text-black">Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ecoReport.map(eco => (
                      <TableRow key={eco.id} className="border-border print:border-b print:border-gray-300">
                        <TableCell className="font-medium print:text-black">{eco.title}</TableCell>
                        <TableCell className="print:text-black"><TypeBadge type={eco.type} /></TableCell>
                        <TableCell className="text-muted-foreground print:text-black">{eco.productName}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openChangesModal(eco)}>
                            View {eco.type === 'PRODUCT' ? (eco.productChanges?.length || 0) : (eco.bomComponentChanges?.length || 0)} change{(eco.type === 'PRODUCT' ? (eco.productChanges?.length || 0) : (eco.bomComponentChanges?.length || 0)) !== 1 ? 's' : ''}
                          </Button>
                        </TableCell>
                        <TableCell className="print:text-black"><StatusBadge status={eco.stage} /></TableCell>
                        <TableCell className="print:text-black"><StatusBadge status={eco.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm print:text-black">{eco.createdAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="product">
          <div className="mb-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64 bg-muted border-border"><SelectValue placeholder="Select a product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {versions.length === 0 ? <EmptyState message="Select a product to view versions" /> : (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Version</TableHead><TableHead>Sale Price</TableHead><TableHead>Cost Price</TableHead><TableHead>Status</TableHead><TableHead>Created Via</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {[...versions].sort((a, b) => a.version - b.version).map((v, i, arr) => {
                      const prev = i > 0 ? arr[i - 1] : null;
                      const salePriceChanged = prev && v.salePrice !== prev.salePrice;
                      const salePriceIncreased = prev && v.salePrice > prev.salePrice;
                      const costPriceChanged = prev && v.costPrice !== prev.costPrice;
                      const costPriceIncreased = prev && v.costPrice > prev.costPrice;

                      return (
                        <TableRow key={v.version} className={`border-border ${v.status === 'ACTIVE' ? 'bg-success/5' : ''}`}>
                          <TableCell>v{v.version}</TableCell>
                          <TableCell className={salePriceChanged ? (salePriceIncreased ? 'text-green-500 font-bold' : 'text-red-500 font-bold') : ''}>
                            ${v.salePrice}
                          </TableCell>
                          <TableCell className={costPriceChanged ? (costPriceIncreased ? 'text-red-500 font-bold' : 'text-green-500 font-bold') : ''}>
                            ${v.costPrice}
                          </TableCell>
                          <TableCell><StatusBadge status={v.status} /></TableCell>
                          <TableCell className="text-muted-foreground">{v.createdVia || '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{v.createdAt}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom">
          <div className="mb-4">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64 bg-muted border-border"><SelectValue placeholder="Select a product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {!selectedProduct ? <EmptyState message="Select a product above to view its BOM change history" /> : bomHistory.length === 0 ? <EmptyState message="No BOM changes found for this product" /> : (
                <Accordion type="single" collapsible className="p-4">
                  {bomHistory.map((eco) => {
                    const { componentChanges, operationChanges } = splitBomChanges(eco);
                    return (
                      <AccordionItem key={eco.id} value={eco.id}>
                        <AccordionTrigger>
                          <div className="text-left">
                            <div className="font-medium">ECO: {eco.title}</div>
                            <div className="text-xs text-muted-foreground">Applied on {eco.createdAt} | By {eco.createdByName}</div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            <Table>
                              <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Component</TableHead><TableHead>Old Qty</TableHead><TableHead>New Qty</TableHead><TableHead>Change Type</TableHead></TableRow></TableHeader>
                              <TableBody>
                                {componentChanges.map((c, i) => (
                                  <TableRow key={`${c.componentName}-${i}`} className="border-border">
                                    <TableCell>{c.componentName}</TableCell>
                                    <TableCell>{c.oldQty ?? '—'}</TableCell>
                                    <TableCell>{c.newQty ?? '—'}</TableCell>
                                    <TableCell><Badge variant="outline" className={c.changeType === 'ADDED' ? 'bg-success/15 text-success border-success/30' : c.changeType === 'REMOVED' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30'}>{c.changeType}</Badge></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {operationChanges.length > 0 && (
                              <Table>
                                <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Operation</TableHead><TableHead>Old</TableHead><TableHead>New</TableHead><TableHead>Change</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {operationChanges.map((op, i) => (
                                    <TableRow key={`${op.componentName}-${i}`} className="border-border">
                                      <TableCell>{String(op.componentName).replace(/^OP_/, '')}</TableCell>
                                      <TableCell>{op.oldQty ?? '—'}</TableCell>
                                      <TableCell>{op.newQty ?? '—'}</TableCell>
                                      <TableCell><Badge variant="outline">{op.changeType}</Badge></TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                            <div className="text-sm text-muted-foreground">
                              <Link className="text-primary hover:underline" to={`/ecos/${eco.id}`}>View ECO</Link>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {auditLog.length === 0 ? <EmptyState message="No audit entries" /> : (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Action</TableHead><TableHead>Type</TableHead><TableHead>User</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead><TableHead>Time</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {auditLog.map(entry => (
                      <TableRow key={entry.id} className="border-border">
                        <TableCell className="font-medium">{entry.action}</TableCell>
                        <TableCell><Badge variant="outline" className={actionColors[entry.actionType]}>{entry.actionType}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{entry.userName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={entry.oldValue}>
                          {(() => {
                            if (!entry.oldValue) return '—';
                            try {
                              const parsed = JSON.parse(entry.oldValue);
                              if (typeof parsed === 'object' && parsed !== null) {
                                return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
                              }
                            } catch { /* empty */ }
                            return entry.oldValue;
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-xs truncate" title={entry.newValue}>
                          {(() => {
                            if (!entry.newValue) return '—';
                            try {
                              const parsed = JSON.parse(entry.newValue);
                              if (typeof parsed === 'object' && parsed !== null) {
                                return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
                              }
                            } catch { /* empty */ }
                            return entry.newValue;
                          })()}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(entry.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {archivedProducts.length === 0 ? (
                <EmptyState message="No archived products found. Archived products appear here for audit and traceability purposes" icon={Archive} />
              ) : (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Product Name</TableHead><TableHead>Total Versions</TableHead><TableHead>Last Version</TableHead><TableHead>Final Sale Price</TableHead><TableHead>Final Cost Price</TableHead><TableHead>Archived Date</TableHead><TableHead>Archived Via</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {archivedProducts.map((p) => (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.totalVersions}</TableCell>
                        <TableCell>{p.lastVersion ? `v${p.lastVersion}` : '—'}</TableCell>
                        <TableCell>{p.finalSalePrice != null ? `$${p.finalSalePrice}` : '—'}</TableCell>
                        <TableCell>{p.finalCostPrice != null ? `$${p.finalCostPrice}` : '—'}</TableCell>
                        <TableCell>{p.createdAt}</TableCell>
                        <TableCell>{p.archivedVia ? <Link className="text-primary hover:underline" to={`/ecos/${p.archivedVia.id}`}>{p.archivedVia.title}</Link> : '—'}</TableCell>
                        <TableCell><Button size="sm" variant="outline" onClick={() => { setSelectedArchivedProduct(p); setHistoryOpen(true); }}>View History</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="space-y-4">
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-4 text-sm">
                This matrix shows the complete active state of all products. A healthy product has an Active Product + Active Version + Active BOM. Missing items indicate incomplete configuration.
              </CardContent>
            </Card>
            <div className="grid grid-cols-4 gap-3">
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Active Products</div><div className="text-2xl font-semibold">{matrixSummary.total}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Products with Active BOM</div><div className="text-2xl font-semibold text-success">{matrixSummary.withBom}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Products WITHOUT BOM</div><div className="text-2xl font-semibold text-warning">{matrixSummary.withoutBom}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Complete (Product + Version + BOM)</div><div className="text-2xl font-semibold text-success">{matrixSummary.complete}</div></CardContent></Card>
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                {activeMatrix.length === 0 ? <EmptyState message="All products are fully configured" icon={Grid2x2} /> : (
                  <Table>
                    <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Product Name</TableHead><TableHead>Active Version</TableHead><TableHead>Sale Price</TableHead><TableHead>Cost Price</TableHead><TableHead>Active BOM Version</TableHead><TableHead>Components</TableHead><TableHead>Operations</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {activeMatrix.map((row) => {
                        const status = getMatrixStatus(row);
                        return (
                          <Fragment key={row.productId}>
                            <TableRow className="border-border cursor-pointer" onClick={() => setExpandedMatrix(expandedMatrix === row.productId ? null : row.productId)}>
                              <TableCell className="font-medium">{row.productName} <Badge variant="outline" className="ml-2 bg-success/15 text-success border-success/30">ACTIVE</Badge></TableCell>
                              <TableCell>{row.activeVersion ? `v${row.activeVersion.version}` : 'No version'}</TableCell>
                              <TableCell>{row.activeVersion ? `$${row.activeVersion.salePrice}` : '—'}</TableCell>
                              <TableCell>{row.activeVersion ? `$${row.activeVersion.costPrice}` : '—'}</TableCell>
                              <TableCell>{row.activeBOM ? `BOM v${row.activeBOM.version}` : 'No BOM'}</TableCell>
                              <TableCell>{row.componentCount || '—'}</TableCell>
                              <TableCell>{row.operationCount || '—'}</TableCell>
                              <TableCell><Badge variant="outline" className={status.cls}>{status.label}</Badge></TableCell>
                              <TableCell>{!row.isComplete ? <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate('/ecos', { state: { openCreate: true, productId: row.productId } }); }}>Raise ECO</Button> : '—'}</TableCell>
                            </TableRow>
                            {expandedMatrix === row.productId && (
                              <TableRow className="border-border bg-muted/30">
                                <TableCell colSpan={9}>
                                  <div className="text-sm space-y-2">
                                    <div>
                                      <div className="font-medium">Components</div>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {row.activeBOM?.components?.length ? row.activeBOM.components.map((c) => <Badge key={c.id} variant="outline">{c.componentName} {c.quantity}{c.unit}</Badge>) : <span className="text-muted-foreground">—</span>}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-medium">Operations</div>
                                      <div className="flex flex-wrap gap-2 mt-1">
                                        {row.activeBOM?.operations?.length ? row.activeBOM.operations.map((o) => <Badge key={o.id} variant="outline">{o.name} {o.duration}m {o.workCenter}</Badge>) : <span className="text-muted-foreground">—</span>}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={changesOpen} onOpenChange={setChangesOpen}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>{selectedEco ? `Changes in ${selectedEco.title}` : 'ECO Changes'}</DialogTitle>
            <DialogDescription>
              {selectedEco ? `${selectedEco.type} ECO • ${selectedEco.status} • ${selectedEco.productName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedEco && (
            <div className="space-y-4">
              {selectedEco.type === 'PRODUCT' && (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Field</TableHead><TableHead>Old Value</TableHead><TableHead>New Value</TableHead><TableHead>Direction</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(selectedEco.productChanges || []).map((c, i) => (
                      <TableRow key={`${c.field}-${i}`} className="border-border">
                        <TableCell>{c.field}</TableCell>
                        <TableCell className="text-destructive">${c.oldValue}</TableCell>
                        <TableCell className="text-success">${c.newValue}</TableCell>
                        <TableCell>{c.newValue > c.oldValue ? 'Increase' : c.newValue < c.oldValue ? 'Decrease' : 'No change'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {selectedEco.type === 'BOM' && (
                <>
                  <Table>
                    <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Component</TableHead><TableHead>Old Qty</TableHead><TableHead>New Qty</TableHead><TableHead>Change Type</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {splitBomChanges(selectedEco).componentChanges.map((c, i) => (
                        <TableRow key={`${c.componentName}-${i}`} className={`border-border ${c.changeType === 'ADDED' ? 'bg-success/5' : c.changeType === 'REMOVED' ? 'bg-destructive/5' : ''}`}>
                          <TableCell>{c.componentName}</TableCell>
                          <TableCell>{c.oldQty ?? '—'}</TableCell>
                          <TableCell>{c.newQty ?? '—'}</TableCell>
                          <TableCell><Badge variant="outline" className={c.changeType === 'ADDED' ? 'bg-success/15 text-success border-success/30' : c.changeType === 'REMOVED' ? 'bg-destructive/15 text-destructive border-destructive/30' : 'bg-warning/15 text-warning border-warning/30'}>{c.changeType}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Table>
                    <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Operation</TableHead><TableHead>Old</TableHead><TableHead>New</TableHead><TableHead>Change Type</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {splitBomChanges(selectedEco).operationChanges.map((c, i) => (
                        <TableRow key={`${c.componentName}-${i}`} className="border-border">
                          <TableCell>{String(c.componentName).replace(/^OP_/, '')}</TableCell>
                          <TableCell>{c.oldQty ?? '—'}</TableCell>
                          <TableCell>{c.newQty ?? '—'}</TableCell>
                          <TableCell><Badge variant="outline">{c.changeType}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
              <div>
                <Link to={`/ecos/${selectedEco.id}`} className="text-primary hover:underline">View Full ECO</Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle>{selectedArchivedProduct?.name} Version History</DialogTitle>
            <DialogDescription>{selectedArchivedProduct ? `${selectedArchivedProduct.totalVersions} versions in history` : ''}</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Version</TableHead><TableHead>Sale Price</TableHead><TableHead>Cost Price</TableHead><TableHead>Status</TableHead><TableHead>Created Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {(selectedArchivedProduct?.versions || []).map((v) => (
                <TableRow key={v.version} className="border-border">
                  <TableCell>v{v.version}</TableCell>
                  <TableCell>${v.salePrice}</TableCell>
                  <TableCell>${v.costPrice}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell>{v.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
