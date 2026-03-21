import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Layers, GitPullRequest, Clock } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { useECOStore } from '@/stores/useECOStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statCards = [
  { label: 'Total Products', icon: Package, color: 'text-primary', bg: 'bg-primary/10', key: 'products' },
  { label: 'Active BOMs', icon: Layers, color: 'text-success', bg: 'bg-success/10', key: 'boms' },
  { label: 'Open ECOs', icon: GitPullRequest, color: 'text-warning', bg: 'bg-warning/10', key: 'openEcos' },
  { label: 'Pending Approvals', icon: Clock, color: 'text-destructive', bg: 'bg-destructive/10', key: 'pending' },
];

export default function DashboardPage() {
  const { products, fetchProducts } = useProductStore();
  const { ecos, fetchECOs } = useECOStore();
  const { boms, fetchBOMs } = useBOMStore();

  useEffect(() => {
    fetchProducts();
    fetchECOs();
    fetchBOMs();
  }, [fetchProducts, fetchECOs, fetchBOMs]);

  const stats = {
    products: products.length,
    boms: boms.filter(b => b.status === 'ACTIVE').length,
    openEcos: ecos.filter(e => e.status !== 'DONE').length,
    pending: ecos.filter(e => e.status === 'IN_REVIEW').length,
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" subtitle="Overview of your PLM system" />

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 stagger-children">
        {statCards.map(card => (
          <Card key={card.key} className="bg-card border-border card-hover">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{stats[card.key as keyof typeof stats]}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent ECOs */}
        <div className="col-span-2">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold">Recent Engineering Change Orders</h3>
                <Link to="/ecos" className="text-sm text-primary hover:underline">View All</Link>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecos.slice(0, 10).map(eco => (
                    <TableRow key={eco.id} className="border-border">
                      <TableCell className="font-medium">
                        <Link to={`/ecos/${eco.id}`} className="hover:text-primary">{eco.title}</Link>
                      </TableCell>
                      <TableCell><TypeBadge type={eco.type} /></TableCell>
                      <TableCell className="text-muted-foreground">{eco.productName}</TableCell>
                      <TableCell><StatusBadge status={eco.status} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{eco.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/ecos"><GitPullRequest className="h-4 w-4 mr-2" />Create New ECO</Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/products"><Package className="h-4 w-4 mr-2" />Add Product</Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link to="/boms"><Layers className="h-4 w-4 mr-2" />Add BOM</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
