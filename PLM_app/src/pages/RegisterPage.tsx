import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cog } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '@/data/mockData';
import axios from 'axios';

export default function RegisterPage() {
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ENGINEERING');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleAdminVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Adminpanel@1234') {
      setIsAdminVerified(true);
      toast.success('Admin verified. Registration unlocked.');
    } else {
      toast.error('Invalid admin password.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast.success('Account created');
      navigate('/dashboard');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error || 'Registration failed')
        : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm bg-card border-border animate-fade-in shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-destructive/20 flex items-center justify-center mb-3">
              <Cog className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-display text-white">Admin Clearance Required</CardTitle>
            <p className="text-sm text-white/50">Only administrators can provision new accounts</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminVerification} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/70">Master Access Key</Label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  required
                  className="bg-card/40 border-white/10 text-white placeholder:text-white/30"
                  placeholder="Enter admin key..."
                />
              </div>
              <Button type="submit" className="w-full bg-destructive text-white hover:bg-destructive/90 transition-all font-semibold">
                Unlock Registration
              </Button>
            </form>
            <p className="text-center text-sm text-white/40 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">Sign In</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm bg-card border-border animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <Cog className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-display">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">Provisioning New System User</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Account Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label>Role Selection</Label>
              <Select value={role} onValueChange={v => setRole(v as Role)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="ENGINEERING">Engineering</SelectItem>
                  <SelectItem value="APPROVER">Approver</SelectItem>
                  <SelectItem value="OPERATIONS">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
