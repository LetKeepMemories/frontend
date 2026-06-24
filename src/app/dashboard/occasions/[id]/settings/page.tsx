'use client';

import styles from './page.module.css';
import { useState, Suspense, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

interface GalleryImage {
  id: string;
  image_url: string;
}

interface Occasion {
  id: string;
  title: string;
  status: string;
  slug: string;
  bio: string;
  description: string;
  person_first_name: string;
  person_last_name: string;
  gallery_images: GalleryImage[];
}

interface UpdateOccasionPayload {
  title: string;
  status: string;
  person_first_name: string;
  person_last_name: string;
  bio: string;
  description: string;
  slug?: string;
}

function SettingsContent({ id }: { id: string }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('published');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: occasion, isLoading } = useQuery<Occasion>({
    queryKey: ['occasion', id],
    queryFn: async () => {
      const response = await api.get(`/occasions/${id}/`);
      return response.data;
    },
  });

  // Populate the form from the fetched occasion without setState in an
  // Effect: adjust state during render when a new occasion comes in.
  const [loadedOccasion, setLoadedOccasion] = useState<Occasion | null>(null);
  if (occasion && occasion !== loadedOccasion) {
    setLoadedOccasion(occasion);
    setTitle(occasion.title || '');
    setStatus(occasion.status || 'published');
    setSlug(occasion.slug || '');
    setBio(occasion.bio || '');
    setDescription(occasion.description || '');
    setFirstName(occasion.person_first_name || '');
    setLastName(occasion.person_last_name || '');
  }

  const { data: galleryLimitData } = useQuery<{ max_gallery_images: number }>({
    queryKey: ['galleryLimit'],
    queryFn: async () => {
      const response = await api.get('/gallery-limit/');
      return response.data;
    },
  });
  const maxGalleryImages = galleryLimitData?.max_gallery_images ?? 5;

  const [galleryError, setGalleryError] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const galleryImages = occasion?.gallery_images ?? [];
  const remainingSlots = Math.max(0, maxGalleryImages - galleryImages.length);

  const handleAddGalleryImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, remainingSlots);
    e.target.value = '';
    if (files.length === 0) return;

    setGalleryError('');
    setIsUploadingGallery(true);
    try {
      for (const file of files) {
        const imageUrl = await uploadToCloudinary(file, `/occasions/${id}/gallery-signature/`);
        await api.post(`/occasions/${id}/gallery/`, { image_url: imageUrl, file_size: file.size });
      }
      queryClient.invalidateQueries({ queryKey: ['occasion', id] });
    } catch (err: unknown) {
      setGalleryError(getErrorMessage(err, 'Failed to upload photo.'));
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    if (!window.confirm('Remove this photo from the gallery?')) return;
    setGalleryError('');
    setDeletingImageId(imageId);
    try {
      await api.delete(`/occasions/${id}/gallery/${imageId}/`);
      queryClient.invalidateQueries({ queryKey: ['occasion', id] });
    } catch (err: unknown) {
      setGalleryError(getErrorMessage(err, 'Failed to remove photo.'));
    } finally {
      setDeletingImageId(null);
    }
  };

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const payload: UpdateOccasionPayload = {
        title,
        status,
        person_first_name: firstName,
        person_last_name: lastName,
        bio,
        description,
      };
      if (slug.trim()) payload.slug = slug.trim();

      await api.patch(`/occasions/${id}/`, payload);
      setSuccess('Settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['occasion', id] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update occasion.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <div className={styles.container}>
      <main className={`container ${styles.main}`}>
        <Link href={`/dashboard/occasions/${id}`} className={styles.backBtn}>
          &larr; Back to Occasion
        </Link>
        
        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>General Settings</h2>
          
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          
          <form id="settings-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label>Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={styles.input} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label>Custom URL Path</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.input}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label>Honoree First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={styles.input} />
              </div>
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label>Honoree Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={styles.input} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Biography</label>
              <textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={styles.input} />
            </div>

            <div className={styles.inputGroup}>
              <label>Description / Welcome Message</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className={styles.input} />
            </div>
          </form>
        </div>

        <div className={styles.sectionCard}>
          <h2 className={styles.sectionTitle}>Gallery</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Add up to {maxGalleryImages} photos to showcase this occasion ({galleryImages.length}/{maxGalleryImages} used).
          </p>

          {galleryError && <div className={styles.error}>{galleryError}</div>}

          {galleryImages.length > 0 && (
            <div className={styles.galleryGrid}>
              {galleryImages.map((image) => (
                <div key={image.id} className={styles.galleryItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.image_url} alt="Gallery" className={styles.galleryImage} />
                  <button
                    type="button"
                    onClick={() => handleDeleteGalleryImage(image.id)}
                    className={styles.deleteImageBtn}
                    disabled={deletingImageId === image.id}
                    aria-label="Remove photo"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {remainingSlots > 0 && (
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddGalleryImages}
              disabled={isUploadingGallery}
              className={styles.input}
              style={{ marginTop: '1rem' }}
            />
          )}
          {isUploadingGallery && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Uploading...</p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', marginBottom: '2rem' }}>
          <button type="submit" form="settings-form" className={styles.btnPrimary} disabled={isSubmitting} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            {isSubmitting ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>

        <div className={styles.sectionCard} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h2 className={styles.sectionTitle} style={{ color: 'var(--danger)' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Once you delete an occasion, there is no going back. Please be certain.
          </p>
          <button 
            className={styles.btnDanger}
            onClick={async () => {
              if (confirm('Are you sure you want to permanently delete this occasion?')) {
                try {
                  await api.delete(`/occasions/${id}/`);
                  router.push('/dashboard');
                } catch {
                  alert('Failed to delete occasion.');
                }
              }
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            Delete Occasion
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent id={resolvedParams.id} />
    </Suspense>
  );
}
