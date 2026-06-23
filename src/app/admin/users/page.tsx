'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import styles from '../page.module.css';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  date_joined: string;
  active_plan: string;
}

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading } = useQuery<{ results: AdminUser[] }>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/admin/users/');
      return response.data;
    },
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  if (authLoading || isLoading) {
    return <div style={{ padding: '2rem' }}>Loading users...</div>;
  }

  if (!isAuthenticated || user?.user_type !== 'admin') {
    return null;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Users & Subscriptions</h1>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Joined Date</th>
              <th>Active Plan</th>
            </tr>
          </thead>
          <tbody>
            {data?.results?.map((u) => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`${styles.badge} ${u.user_type === 'admin' ? styles.badgeAdmin : styles.badgeUser}`}>
                    {u.user_type}
                  </span>
                </td>
                <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                <td>
                  <span className={styles.badgePlan}>
                    {u.active_plan}
                  </span>
                </td>
              </tr>
            ))}
            {(!data?.results || data.results.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
