import { useEffect, useState } from 'react';
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
import { Download, BarChart3 } from 'lucide-react';
import { reportsService } from '@/services/reports.service';
import { useProductStore } from '@/stores/useProductStore';
import type { ECO, ProductVersion, AuditEntry, BOM } from '@/data/mockData';

const actionColors: Record<string, string> = {
  CREATE: 'bg-primary/15 text-primary border-primary/30',
  UPDATE: 'bg-warning/15 text-warning border-warning/30',
  APPROVE: 'bg-success/15 text-success border-success/30',
  REJECT: 'bg-destructive/15 text-destructive border-destructive/30',
  ARCHIVE: 'bg-muted/60 text-muted-foreground border-muted',
};

export default function ReportsPage() {
  const { products, fetchProducts } = useProductStore();
  const [ecoReport, setEcoReport] = useState<ECO[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [versions, setVersions] = useState<ProductVersion[]>([]);
  const [bomHistory, setBomHistory] = useState<BOM[]>([]);

  useEffect(() => {
    fetchProducts();
    reportsService.getECOReport().then(setEcoReport);
    reportsService.getAuditLog().then(setAuditLog);
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProduct) {
      reportsService.getVersionHistory(selectedProduct).then(setVersions);
      reportsService.getBOMHistory(selectedProduct).then(setBomHistory);
    }
  }, [selectedProduct]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports & Audit Trail" />

      <Tabs defaultValue="eco" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="eco">ECO Report</TabsTrigger>
          <TabsTrigger value="product">Product Versions</TabsTrigger>
          <TabsTrigger value="bom">BOM History</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="eco">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">ECO Report</h3>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
              </div>
              {ecoReport.length === 0 ? <EmptyState message="No ECO data" icon={BarChart3} /> : (
                <Table>
                  <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Product</TableHead><TableHead>Stage</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ecoReport.map(eco => (
                      <TableRow key={eco.id} className="border-border">
                        <TableCell className="font-medium">{eco.title}</TableCell>
                        <TableCell><TypeBadge type={eco.type} /></TableCell>
                        <TableCell className="text-muted-foreground">{eco.productName}</TableCell>
                        <TableCell><StatusBadge status={eco.stage} /></TableCell>
                        <TableCell><StatusBadge status={eco.status} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{eco.createdAt}</TableCell>
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
                    {versions.map(v => (
                      <TableRow key={v.version} className={`border-border ${v.status === 'ACTIVE' ? 'bg-success/5' : ''}`}>
                        <TableCell>v{v.version}</TableCell>
                        <TableCell>${v.salePrice}</TableCell>
                        <TableCell>${v.costPrice}</TableCell>
                        <TableCell><StatusBadge status={v.status} /></TableCell>
                        <TableCell className="text-muted-foreground">{v.createdVia || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{v.createdAt}</TableCell>
                      </TableRow>
                    ))}
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
              {bomHistory.length === 0 ? <EmptyState message="Select a product to view BOM history" /> : (
                <div className="p-4 space-y-4">
                  {bomHistory.map(bom => (
                    <div key={bom.id}>
                      <h4 className="font-medium mb-2">{bom.productName} — v{bom.currentVersion} <StatusBadge status={bom.status} /></h4>
                      <Table>
                        <TableHeader><TableRow className="border-border hover:bg-transparent"><TableHead>Component</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead></TableRow></TableHeader>
                        <TableBody>{bom.components.map(c => (<TableRow key={c.id} className="border-border"><TableCell>{c.name}</TableCell><TableCell>{c.quantity}</TableCell><TableCell>{c.unit}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
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
                        <TableCell className="text-muted-foreground text-sm">{entry.oldValue || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{entry.newValue || '—'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(entry.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
