'use client';

import styles from '../page.module.css';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface RevenueSummary {
  total_revenue: string | number;
  successful_count: number;
  failed_count: number;
  pending_count: number;
}

interface Payment {
  id: string;
  user_email: string;
  user_name: string;
  plan_name: string | null;
  provider: string;
  reference: string;
  amount: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

function statusBadgeClass(status: string) {
  if (status === 'success') return styles.badgeSuccess;
  if (status === 'failed') return styles.badgeFailed;
  return styles.badgePending;
}

export default function AdminRevenuePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const isAdmin = isAuthenticated && user?.user_type === 'admin';

  const { data: summary, isLoading: summaryLoading } = useQuery<RevenueSummary>({
    queryKey: ['adminRevenueSummary'],
    queryFn: async () => {
      const response = await api.get('/admin/revenue/');
      return response.data;
    },
    enabled: isAdmin,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['adminPayments'],
    queryFn: async () => {
      // Paginated ({count, next, previous, results}); unwrap to the array.
      const response = await api.get('/admin/payments/');
      return response.data.results;
    },
    enabled: isAdmin,
  });

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!isAuthenticated || user?.user_type !== 'admin') return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Revenue & Payments</h1>
      </div>

      {!summaryLoading && summary && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Revenue</div>
            <div className={styles.statValue}>${summary.total_revenue}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Successful Payments</div>
            <div className={styles.statValue}>{summary.successful_count}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Failed Payments</div>
            <div className={styles.statValue}>{summary.failed_count}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending Payments</div>
            <div className={styles.statValue}>{summary.pending_count}</div>
          </div>
        </div>
      )}

      {paymentsLoading ? (
        <div>Loading payments...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Provider</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    {payment.user_name}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{payment.user_email}</div>
                  </td>
                  <td>{payment.plan_name || '-'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{payment.provider}</td>
                  <td>{payment.reference}</td>
                  <td>${payment.amount}</td>
                  <td>
                    <span className={`${styles.badge} ${statusBadgeClass(payment.status)}`}>{payment.status}</span>
                  </td>
                  <td>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {payments?.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No payments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
