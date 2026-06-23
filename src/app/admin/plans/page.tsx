'use client';

import styles from '../page.module.css';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  billing_cycle: string;
  max_images_count: number;
  max_video_count: number;
  max_audio_count: number;
  max_storage: number;
  allow_video: boolean;
  allow_audio_message: boolean;
  max_video_size: number;
  is_active: boolean;
  is_free: boolean;
}

interface PlanFormState {
  id: string | null;
  name: string;
  price: string;
  billing_cycle: string;
  max_images_count: string;
  max_video_count: string;
  max_audio_count: string;
  max_storage: string;
  allow_video: boolean;
  allow_audio_message: boolean;
  max_video_size: string;
  is_active: boolean;
  is_free: boolean;
}

const EMPTY_FORM: PlanFormState = {
  id: null,
  name: '',
  price: '0',
  billing_cycle: 'monthly',
  max_images_count: '20',
  max_video_count: '0',
  max_audio_count: '0',
  max_storage: '500',
  allow_video: false,
  allow_audio_message: false,
  max_video_size: '0',
  is_active: true,
  is_free: false,
};

function planToForm(plan: SubscriptionPlan): PlanFormState {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    billing_cycle: plan.billing_cycle,
    max_images_count: String(plan.max_images_count),
    max_video_count: String(plan.max_video_count),
    max_audio_count: String(plan.max_audio_count),
    max_storage: String(plan.max_storage),
    allow_video: plan.allow_video,
    allow_audio_message: plan.allow_audio_message,
    max_video_size: String(plan.max_video_size),
    is_active: plan.is_active,
    is_free: plan.is_free,
  };
}

export default function AdminPlansPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanFormState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['adminPlans'],
    queryFn: async () => {
      const response = await api.get('/admin/plans/');
      return response.data;
    },
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  const saveMutation = useMutation({
    mutationFn: async (values: PlanFormState) => {
      const payload = {
        name: values.name,
        price: values.price,
        billing_cycle: values.billing_cycle,
        max_images_count: Number(values.max_images_count),
        max_video_count: Number(values.max_video_count),
        max_audio_count: Number(values.max_audio_count),
        max_storage: Number(values.max_storage),
        allow_video: values.allow_video,
        allow_audio_message: values.allow_audio_message,
        max_video_size: Number(values.max_video_size),
        is_active: values.is_active,
        is_free: values.is_free,
      };
      if (values.id) {
        await api.patch(`/admin/plans/${values.id}/`, payload);
      } else {
        await api.post('/admin/plans/', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPlans'] });
      setForm(null);
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to save plan.')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/plans/${id}/`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPlans'] }),
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to delete plan.')),
  });

  const handleDelete = (plan: SubscriptionPlan) => {
    if (!window.confirm(`Delete the "${plan.name}" plan? Existing subscribers keep their plan reference, but it will no longer be purchasable.`)) return;
    setError('');
    deleteMutation.mutate(plan.id);
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
        <h1>Subscription Plans</h1>
        <button className={styles.btnPrimary} onClick={() => setForm(EMPTY_FORM)} type="button">
          + New Plan
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {form && (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h3 style={{ margin: 0 }}>{form.id ? 'Edit Plan' : 'New Plan'}</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="price">Price</label>
              <input id="price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="billing_cycle">Billing Cycle</label>
              <select id="billing_cycle" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })} className={styles.input}>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="max_images_count">Max Images / Occasion</label>
              <input id="max_images_count" type="number" min="0" value={form.max_images_count} onChange={(e) => setForm({ ...form, max_images_count: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_video_count">Max Videos / Occasion</label>
              <input id="max_video_count" type="number" min="0" value={form.max_video_count} onChange={(e) => setForm({ ...form, max_video_count: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_audio_count">Max Audio / Occasion</label>
              <input id="max_audio_count" type="number" min="0" value={form.max_audio_count} onChange={(e) => setForm({ ...form, max_audio_count: e.target.value })} className={styles.input} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="max_storage">Total Storage (MB)</label>
              <input id="max_storage" type="number" min="0" value={form.max_storage} onChange={(e) => setForm({ ...form, max_storage: e.target.value })} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_video_size">Max Video Size (MB)</label>
              <input id="max_video_size" type="number" min="0" value={form.max_video_size} onChange={(e) => setForm({ ...form, max_video_size: e.target.value })} className={styles.input} />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={form.allow_video} onChange={(e) => setForm({ ...form, allow_video: e.target.checked })} />
              Allow video uploads
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={form.allow_audio_message} onChange={(e) => setForm({ ...form, allow_audio_message: e.target.checked })} />
              Allow audio messages
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active (purchasable)
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} />
              Free Plan
            </label>
          </div>

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
        <div>Loading plans...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Cycle</th>
                <th>Images</th>
                <th>Videos</th>
                <th>Audio</th>
                <th>Storage</th>
                <th>Status</th>
                <th>Free</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans?.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.name}</td>
                  <td>${plan.price}</td>
                  <td style={{ textTransform: 'capitalize' }}>{plan.billing_cycle}</td>
                  <td>{plan.max_images_count}</td>
                  <td>{plan.allow_video ? plan.max_video_count : '-'}</td>
                  <td>{plan.allow_audio_message ? plan.max_audio_count : '-'}</td>
                  <td>{plan.max_storage} MB</td>
                  <td>
                    <span className={`${styles.badge} ${plan.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {plan.is_free ? (
                      <span className={`${styles.badge} ${styles.badgeActive}`}>Yes</span>
                    ) : (
                      <span className={styles.badge} style={{ opacity: 0.5 }}>No</span>
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={styles.btnOutline} onClick={() => setForm(planToForm(plan))} type="button">
                      Edit
                    </button>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleDelete(plan)}
                      disabled={deleteMutation.isPending}
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {plans?.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>No plans yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
