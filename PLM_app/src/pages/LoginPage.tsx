import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Cog } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('alice@plmcontrol.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const loggedInUser = useAuthStore.getState().user;
      toast.success('Logged in successfully');
      navigate(loggedInUser?.role === 'OPERATIONS' ? '/products' : '/dashboard');
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.error || 'Login failed')
        : 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm bg-card border-border animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3">
            <Cog className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-display">PLM Control</CardTitle>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-muted border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-muted border-border" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
