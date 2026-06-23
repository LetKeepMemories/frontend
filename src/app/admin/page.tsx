'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, CalendarDays, CreditCard } from 'lucide-react';

interface AdminStats {
  total_users: number;
  total_occasions: number;
  active_subscriptions: number;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/admin/stats/');
      return response.data;
    },
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!isAuthenticated || user?.user_type !== 'admin') return null;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Welcome to the Admin Panel</h1>
      
      {statsLoading ? (
        <div>Loading stats...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <Users size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</p>
              <h3 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-heading)' }}>{stats?.total_users || 0}</h3>
            </div>
          </div>

          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <CalendarDays size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Occasions</p>
              <h3 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-heading)' }}>{stats?.total_occasions || 0}</h3>
            </div>
          </div>

          <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
              <CreditCard size={32} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Subscriptions</p>
              <h3 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-heading)' }}>{stats?.active_subscriptions || 0}</h3>
            </div>
          </div>

        </div>
      )}

      <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h2>System Overview</h2>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
          You have successfully logged into the frontend admin dashboard.
          Currently, to manage database records directly, please click the &ldquo;Open Django Admin&rdquo; link in the sidebar to access the fully-featured backend administration interface.
        </p>
      </div>
    </div>
  );
}
