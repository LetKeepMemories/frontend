'use client';

import styles from '../page.module.css';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

interface EventType {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

interface EventTypeFormState {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
}

const EMPTY_FORM: EventTypeFormState = { id: null, name: '', slug: '', description: '', is_active: true };

export default function AdminEventTypesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventTypeFormState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data: eventTypes, isLoading } = useQuery<EventType[]>({
    queryKey: ['adminEventTypes'],
    queryFn: async () => {
      const response = await api.get('/admin/event-types/');
      return response.data;
    },
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const saveMutation = useMutation({
    mutationFn: async (values: EventTypeFormState) => {
      const payload = { name: values.name, slug: values.slug || undefined, description: values.description, is_active: values.is_active };
      if (values.id) {
        await api.patch(`/admin/event-types/${values.id}/`, payload);
      } else {
        await api.post('/admin/event-types/', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEventTypes'] });
      setForm(null);
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to save event type.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/event-types/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminEventTypes'] }),
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to delete event type.')),
  });

  const handleDelete = (eventType: EventType) => {
    if (!window.confirm(`Delete "${eventType.name}"? Occasions using this type will be unaffected, but it will no longer be selectable.`)) return;
    setError('');
    deleteMutation.mutate(eventType.id);
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    saveMutation.mutate(form);
  };

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!isAuthenticated || user?.user_type !== 'admin') return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Event Types</h1>
        <button className={styles.btnPrimary} onClick={() => setForm(EMPTY_FORM)} type="button">
          + New Event Type
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {form && (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h3 style={{ margin: 0 }}>{form.id ? 'Edit Event Type' : 'New Event Type'}</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="slug">Slug (optional, auto-generated if blank)</label>
              <input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={styles.input}
            />
          </div>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active (selectable when creating an occasion)
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className={styles.btnOutline} onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div>Loading event types...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes?.map((et) => (
                <tr key={et.id}>
                  <td>{et.name}</td>
                  <td>{et.slug}</td>
                  <td>{et.description || '-'}</td>
                  <td>
                    <span className={`${styles.badge} ${et.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {et.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.btnOutline} onClick={() => setForm(et)} type="button">
                      Edit
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(et)}
                      disabled={deleteMutation.isPending}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {eventTypes?.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No event types yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
