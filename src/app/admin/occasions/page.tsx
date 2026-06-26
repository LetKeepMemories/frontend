'use client';

import styles from '../page.module.css';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

interface AdminOccasion {
  id: string;
  title: string;
  slug: string;
  public_url: string;
  status: string;
  event_type: { name: string };
  person_full_name: string;
  message_count: number;
  owner_email: string;
  owner_name: string;
  created_at: string;
}

export default function AdminOccasionsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data: occasions, isLoading } = useQuery<AdminOccasion[]>({
    queryKey: ['adminOccasions'],
    queryFn: async () => {
      const response = await api.get('/admin/occasions/');
      return Array.isArray(response.data) ? response.data : (response.data.results || []);
    },
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/occasions/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminOccasions'] }),
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to delete occasion.')),
  });

  const handleDelete = (occasion: AdminOccasion) => {
    if (!window.confirm(`Permanently delete "${occasion.title}"? This removes all of its messages and media too.`)) return;
    setError('');
    deleteMutation.mutate(occasion.id);
  };

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!isAuthenticated || user?.user_type !== 'admin') return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>All Occasions</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isLoading ? (
        <div>Loading occasions...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Status</th>
                <th>Messages</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {occasions?.map((occ) => (
                <tr key={occ.id}>
                  <td>{occ.title}</td>
                  <td>
                    {occ.owner_name}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{occ.owner_email}</div>
                  </td>
                  <td>{occ.event_type?.name || '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${occ.status === 'published' ? styles.badgeActive : styles.badgeInactive}`}>
                      {occ.status}
                    </span>
                  </td>
                  <td>{occ.message_count}</td>
                  <td>{new Date(occ.created_at).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={new URL(occ.public_url, window.location.origin).toString()} target="_blank" rel="noopener noreferrer" className={styles.btnOutline}>
                      View
                    </a>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(occ)}
                      disabled={deleteMutation.isPending}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {occasions?.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No occasions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
