import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Layers, GitPullRequest, Clock, Activity, Zap } from 'lucide-react';
import { useProductStore } from '@/stores/useProductStore';
import { useECOStore } from '@/stores/useECOStore';
import { useBOMStore } from '@/stores/useBOMStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { StatusBadge } from '@/components/StatusBadge';
import { TypeBadge } from '@/components/TypeBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ShortcutDef = { label: string; to: string; Icon: React.ElementType; color: string };

const roleShortcuts: Record<string, ShortcutDef[]> = {
  ENGINEERING: [
    { label: 'Initialize Product Matrix', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'Construct BOM', to: '/boms', Icon: Layers, color: 'text-secondary' },
    { label: 'Draft Change Order', to: '/ecos/create', Icon: GitPullRequest, color: 'text-warning' },
  ],
  APPROVER: [
    { label: 'Review Products', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'Review BOMs', to: '/boms', Icon: Layers, color: 'text-secondary' },
    { label: 'Review Change Orders', to: '/ecos', Icon: GitPullRequest, color: 'text-warning' },
  ],
  ADMIN: [
    { label: 'Manage Products', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'Manage BOMs', to: '/boms', Icon: Layers, color: 'text-secondary' },
    { label: 'View Change Orders', to: '/ecos', Icon: GitPullRequest, color: 'text-warning' },
  ],
  OPERATIONS: [
    { label: 'View Active Products', to: '/products', Icon: Package, color: 'text-primary' },
    { label: 'View Active BOMs', to: '/boms', Icon: Layers, color: 'text-secondary' },
  ],
};

export default function DashboardPage() {
  const { products, fetchProducts } = useProductStore();
  const { ecos, fetchECOs } = useECOStore();
  const { boms, fetchBOMs } = useBOMStore();
  const { user } = useAuthStore();
  const isOperations = user?.role === 'OPERATIONS';

  useEffect(() => {
    const refresh = () => {
      const requests = [fetchProducts(), fetchBOMs()];
      if (!isOperations) requests.push(fetchECOs());
      void Promise.all(requests);
    };
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const onFocus = () => refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [fetchProducts, fetchECOs, fetchBOMs, isOperations]);

  const stats = {
    products: products.length,
    boms: boms.filter(b => b.status === 'ACTIVE').length,
    openEcos: ecos.filter(e => e.status !== 'DONE').length,
    pending: ecos.filter(e => e.status === 'IN_REVIEW').length,
  };

  let statCards = [
    { label: 'Total Products', icon: Package, color: 'text-primary', glow: 'shadow-[0_0_30px_-5px_rgba(0,242,255,0.4)]', bg: 'bg-primary/10', border: 'border-primary/20', key: 'products' },
    { label: 'Active BOMs', icon: Layers, color: 'text-success', glow: 'shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]', bg: 'bg-success/10', border: 'border-success/20', key: 'boms' },
    { label: 'Open ECOs', icon: GitPullRequest, color: 'text-warning', glow: 'shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)]', bg: 'bg-warning/10', border: 'border-warning/20', key: 'openEcos' },
    { label: 'Pending Approvals', icon: Clock, color: 'text-destructive', glow: 'shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)]', bg: 'bg-destructive/10', border: 'border-destructive/20', key: 'pending' },
  ];
  if (user?.role === 'OPERATIONS') {
    statCards = statCards.filter(c => c.key === 'products' || c.key === 'boms');
  }

  return (
    <div className="animate-fade-in text-foreground pb-12">
      {/* Header Hero Section */}
      <div className="relative mb-10 overflow-hidden bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-3xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/50 to-transparent"></div>
        <div className="absolute -top-24 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-sans">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-5 shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
              <Zap className="h-4 w-4 text-[#FF00FF] animate-pulse" /> System Online
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3 flex items-center gap-2 drop-shadow-md">
              Command Center
            </h1>
            <p className="text-white/60 text-base font-medium max-w-xl">
              Real-time telemetry and management logic running.
            </p>
          </div>
          {user?.role === 'ENGINEERING' && (
            <div className="flex gap-3">
              <Button asChild className="bg-gradient-to-r from-primary to-[#FF00FF] hover:opacity-90 text-white shadow-[0_10px_20px_rgba(0,212,255,0.3)] hover:shadow-[0_15px_30px_rgba(255,0,255,0.4)] border-0 rounded-2xl h-12 px-8 font-bold text-sm tracking-wide transition-all duration-300">
                <Link to="/ecos/create"><GitPullRequest className="mr-2 h-5 w-5" /> Initiate ECO</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Glass KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 stagger-children">
        {statCards.map(card => (
          <Card key={card.key} className={`bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] card-hover relative overflow-hidden group rounded-3xl`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">{card.label}</p>
                  <p className="text-5xl font-extrabold text-white tracking-tight drop-shadow-md">{stats[card.key as keyof typeof stats]}</p>
                </div>
                <div className={`h-14 w-14 rounded-2xl transition-all duration-300 group-hover:scale-110 shadow-[0_4px_15px_rgba(0,0,0,0.5)] ${card.bg.replace('bg-', 'bg-white/5 text-')} flex items-center justify-center border border-white/10`}>
                  <card.icon className={`h-7 w-7 text-white`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Asymmetric Core Layout */}
      <div className={`grid grid-cols-1 gap-8 ${isOperations ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>

        {/* Recent ECOs - Takes 2 columns */}
        {!isOperations && <div className="lg:col-span-2">
          <Card className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] h-full flex flex-col rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-[#FF00FF]" />
                <h3 className="font-extrabold text-lg text-white tracking-tight">Active Telemetry: ECOs</h3>
              </div>
              <Link to="/ecos" className="text-sm font-bold text-primary hover:text-[#FF00FF] transition-colors">View Trajectory →</Link>
            </div>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 bg-transparent hover:bg-transparent">
                    <TableHead className="text-white/40 font-bold py-5 px-6 text-xs uppercase tracking-widest">Designation</TableHead>
                    <TableHead className="text-white/40 font-bold py-5 text-xs uppercase tracking-widest">Classification</TableHead>
                    <TableHead className="text-white/40 font-bold py-5 text-xs uppercase tracking-widest">Target Schema</TableHead>
                    <TableHead className="text-white/40 font-bold py-5 text-xs uppercase tracking-widest">Status Node</TableHead>
                    <TableHead className="text-white/40 font-bold py-5 pr-6 text-right text-xs uppercase tracking-widest">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecos.slice(0, 6).map(eco => (
                    <TableRow key={eco.id} className="border-white/5 transition-colors hover:bg-white/[0.02] group">
                      <TableCell className="font-bold py-4 px-6 text-white text-sm">
                        <Link to={`/ecos/${eco.id}`} className="group-hover:text-primary transition-colors underline-offset-4">{eco.title}</Link>
                      </TableCell>
                      <TableCell><TypeBadge type={eco.type} /></TableCell>
                      <TableCell className="text-white/60 font-medium text-sm">{eco.productName}</TableCell>
                      <TableCell><StatusBadge status={eco.status} /></TableCell>
                      <TableCell className="text-white/40 text-sm pr-6 text-right font-medium">{eco.createdAt}</TableCell>
                    </TableRow>
                  ))}
                  {ecos.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-white/50 font-medium">No active telemetry found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>}

        {/* Quick Links & Operations - Takes 1 column */}
        <div className="space-y-6 flex flex-col">
          <Card className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden rounded-3xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-[#FF00FF]/10 rounded-full blur-[50px]"></div>
            <div className="p-6 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-extrabold text-lg text-white tracking-tight">Execution Shortcuts</h3>
            </div>
            <CardContent className="p-6 space-y-4 relative z-10">
              {(roleShortcuts[user?.role ?? ''] ?? roleShortcuts['ADMIN']).map(({ label, to, Icon }) => (
                <Button key={label} asChild className="w-full justify-start h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold group rounded-2xl transition-all shadow-sm" variant="outline">
                  <Link to={to}>
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
                    </div>
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Environment Status Card */}
          <Card className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex-1 flex flex-col justify-center items-center p-8 relative overflow-hidden rounded-3xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50"></div>
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 mb-6 shadow-[0_0_30px_0_rgba(0,212,255,0.2)] animate-pulse">
              <ShieldCheckIcon className="h-10 w-10 text-primary drop-shadow-md" />
            </div>
            <h4 className="text-white font-extrabold text-xl mb-2 tracking-tight">System Nominal</h4>
            <p className="text-sm text-white/50 text-center font-medium leading-relaxed">All infrastructure nodes are responding optimally inside the Soft Cyber environment.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
