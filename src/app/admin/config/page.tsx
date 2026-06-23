'use client';

import styles from '../page.module.css';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

interface AdminSubscriptionConfig {
  id: string;
  max_images_count: number;
  max_video_count: number;
  max_audio_count: number;
  max_storage: number;
  allow_video: boolean;
  allow_audio_message: boolean;
  max_video_size: number;
  max_gallery_images: number;
}

interface ConfigFormState {
  max_images_count: string;
  max_video_count: string;
  max_audio_count: string;
  max_storage: string;
  allow_video: boolean;
  allow_audio_message: boolean;
  max_video_size: string;
  max_gallery_images: string;
}

function configToForm(config: AdminSubscriptionConfig): ConfigFormState {
  return {
    max_images_count: String(config.max_images_count),
    max_video_count: String(config.max_video_count),
    max_audio_count: String(config.max_audio_count),
    max_storage: String(config.max_storage),
    allow_video: config.allow_video,
    allow_audio_message: config.allow_audio_message,
    max_video_size: String(config.max_video_size),
    max_gallery_images: String(config.max_gallery_images),
  };
}

export default function AdminConfigPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConfigFormState | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.user_type !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { data: config, isLoading } = useQuery<AdminSubscriptionConfig>({
    queryKey: ['adminSubscriptionConfig'],
    queryFn: async () => {
      const response = await api.get('/admin/config/');
      return response.data;
    },
    enabled: isAuthenticated && user?.user_type === 'admin',
  });

  // Populate the form from the fetched config without setState in an
  // Effect: adjust state during render when the config first arrives.
  const [loadedConfig, setLoadedConfig] = useState(config);
  if (config && config !== loadedConfig) {
    setLoadedConfig(config);
    setForm(configToForm(config));
  }

  const saveMutation = useMutation({
    mutationFn: async (values: ConfigFormState) => {
      const payload = {
        max_images_count: Number(values.max_images_count),
        max_video_count: Number(values.max_video_count),
        max_audio_count: Number(values.max_audio_count),
        max_storage: Number(values.max_storage),
        allow_video: values.allow_video,
        allow_audio_message: values.allow_audio_message,
        max_video_size: Number(values.max_video_size),
        max_gallery_images: Number(values.max_gallery_images),
      };
      const response = await api.patch('/admin/config/', payload);
      return response.data;
    },
    onSuccess: (data: AdminSubscriptionConfig) => {
      queryClient.setQueryData(['adminSubscriptionConfig'], data);
      setSuccess('Limits updated successfully.');
      setError('');
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to save limits.'));
      setSuccess('');
    },
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    setSuccess('');
    saveMutation.mutate(form);
  };

  if (authLoading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!isAuthenticated || user?.user_type !== 'admin') return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Admin Upload Limits</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '640px' }}>
        Admin-owned occasions aren&apos;t tied to a subscription plan. These limits apply to any
        occasion owned by an admin account instead &mdash; except the gallery image limit below,
        which applies platform-wide to every occasion regardless of owner.
      </p>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {isLoading || !form ? (
        <div>Loading current limits...</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="max_images_count">Max Images / Occasion</label>
              <input
                id="max_images_count"
                type="number"
                min="0"
                value={form.max_images_count}
                onChange={(e) => setForm({ ...form, max_images_count: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_video_count">Max Videos / Occasion</label>
              <input
                id="max_video_count"
                type="number"
                min="0"
                value={form.max_video_count}
                onChange={(e) => setForm({ ...form, max_video_count: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_audio_count">Max Audio / Occasion</label>
              <input
                id="max_audio_count"
                type="number"
                min="0"
                value={form.max_audio_count}
                onChange={(e) => setForm({ ...form, max_audio_count: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="max_storage">Total Storage (MB)</label>
              <input
                id="max_storage"
                type="number"
                min="0"
                value={form.max_storage}
                onChange={(e) => setForm({ ...form, max_storage: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_video_size">Max Video Size (MB)</label>
              <input
                id="max_video_size"
                type="number"
                min="0"
                value={form.max_video_size}
                onChange={(e) => setForm({ ...form, max_video_size: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="max_gallery_images">Max Gallery Images (all occasions)</label>
              <input
                id="max_gallery_images"
                type="number"
                min="0"
                value={form.max_gallery_images}
                onChange={(e) => setForm({ ...form, max_gallery_images: e.target.value })}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.allow_video}
                onChange={(e) => setForm({ ...form, allow_video: e.target.checked })}
              />
              Allow video uploads
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={form.allow_audio_message}
                onChange={(e) => setForm({ ...form, allow_audio_message: e.target.checked })}
              />
              Allow audio messages
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnPrimary} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Limits'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
