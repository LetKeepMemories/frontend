'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import styles from '../page.module.css';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  active_plan: string;
}

interface AdminUserOccasion {
  id: string;
  title: string;
  status: string;
  message_count: number;
  created_at: string;
}

interface AdminUserDetail extends AdminUser {
  stats: {
    total_occasions: number;
    total_messages: number;
    total_storage_bytes: number;
  };
  occasions: AdminUserOccasion[];
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ results: AdminUser[] }>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/admin/users/');
      return response.data;
    },
    enabled: currentUser?.user_type === 'admin',
  });

  const { data: selectedUser, isLoading: isDetailLoading } = useQuery<AdminUserDetail>({
    queryKey: ['adminUserDetail', selectedUserId],
    queryFn: async () => {
      const response = await api.get(`/admin/users/${selectedUserId}/`);
      return response.data;
    },
    enabled: !!selectedUserId,
  });

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.patch(`/admin/users/${id}/`, { is_active });
    },
    onSuccess: invalidateUsers,
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to update user status.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}/`);
    },
    onSuccess: invalidateUsers,
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to delete user.')),
  });

  const [actionMessage, setActionMessage] = useState('');

  const triggerPasswordResetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/admin/users/${id}/trigger-password-reset/`);
      return response.data;
    },
    onSuccess: (data) => setActionMessage(data.detail),
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to send password reset email.')),
  });

  const triggerVerificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/admin/users/${id}/trigger-verification/`);
      return response.data;
    },
    onSuccess: (data) => setActionMessage(data.detail),
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to send verification email.')),
  });

  const handleToggleActive = (u: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setError('');
    toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active });
  };

  const handleDelete = (u: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete ${u.email}? This removes all of their occasions, messages and media too.`)) return;
    setError('');
    deleteMutation.mutate(u.id);
  };

  const handleTriggerPasswordReset = (u: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setError('');
    setActionMessage('');
    triggerPasswordResetMutation.mutate(u.id);
  };

  const handleTriggerVerification = (u: AdminUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setError('');
    setActionMessage('');
    triggerVerificationMutation.mutate(u.id);
  };

  if (authLoading || isLoading) {
    return <div style={{ padding: '2rem' }}>Loading users...</div>;
  }

  if (!isAuthenticated || currentUser?.user_type !== 'admin') {
    return null;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Users & Subscriptions</h1>

      {error && <div className={styles.error}>{error}</div>}
      {actionMessage && <div className={styles.success}>{actionMessage}</div>}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Joined Date</th>
              <th>Active Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.results?.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} onClick={() => setSelectedUserId(u.id)} style={{ cursor: 'pointer' }}>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`${styles.badge} ${u.user_type === 'admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                      {u.user_type}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${u.is_verified ? styles.badgeSuccess : styles.badgePending}`}>
                      {u.is_verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td>
                    <span className={styles.badgePlan}>{u.active_plan}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.toggleSwitch}
                        data-on={u.is_active}
                        disabled={isSelf || toggleActiveMutation.isPending}
                        title={isSelf ? "You can't change your own status" : u.is_active ? 'Deactivate' : 'Activate'}
                        onClick={(e) => handleToggleActive(u, e)}
                      >
                        <span className={styles.toggleKnob} />
                      </button>
                      <button
                        type="button"
                        className={styles.btnOutline}
                        disabled={triggerPasswordResetMutation.isPending}
                        onClick={(e) => handleTriggerPasswordReset(u, e)}
                      >
                        Reset Password
                      </button>
                      {!u.is_verified && (
                        <button
                          type="button"
                          className={styles.btnOutline}
                          disabled={triggerVerificationMutation.isPending}
                          onClick={(e) => handleTriggerVerification(u, e)}
                        >
                          Resend Verification
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnDanger}
                        disabled={isSelf || deleteMutation.isPending}
                        title={isSelf ? "You can't delete your own account" : 'Delete'}
                        onClick={(e) => handleDelete(u, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!data?.results || data.results.length === 0) && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUserId && (
        <div className={styles.modalOverlay} onClick={() => setSelectedUserId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setSelectedUserId(null)}>
              &times;
            </button>
            {isDetailLoading || !selectedUser ? (
              <div style={{ padding: '2rem' }}>Loading...</div>
            ) : (
              <>
                <h2 style={{ marginTop: 0 }}>{selectedUser.first_name} {selectedUser.last_name}</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '-0.5rem' }}>{selectedUser.email}</p>

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Occasions</div>
                    <div className={styles.statValue}>{selectedUser.stats.total_occasions}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Messages</div>
                    <div className={styles.statValue}>{selectedUser.stats.total_messages}</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Storage Used</div>
                    <div className={styles.statValue}>{formatBytes(selectedUser.stats.total_storage_bytes)}</div>
                  </div>
                </div>

                <h3>Occasions</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Messages</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.occasions.map((occ) => (
                        <tr key={occ.id}>
                          <td>{occ.title}</td>
                          <td>
                            <span className={`${styles.badge} ${occ.status === 'published' ? styles.badgeActive : styles.badgeInactive}`}>
                              {occ.status}
                            </span>
                          </td>
                          <td>{occ.message_count}</td>
                          <td>{new Date(occ.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {selectedUser.occasions.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem' }}>No occasions yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
