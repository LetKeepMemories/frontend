'use client';

import styles from './page.module.css';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface Occasion {
  id: string;
  title: string;
  public_url: string;
  status: string;
  person_full_name: string;
  message_count: number;
}

interface MediaItem {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'AUDIO';
  url: string;
  thumbnail_url?: string;
  duration?: number;
}

interface OccasionMessage {
  id: string;
  sender_full_name: string;
  relationship: string;
  message: string;
  created_at: string;
  is_hidden: boolean;
  media: MediaItem[];
}

export default function ManageOccasion() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<OccasionMessage | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: occasion, isLoading } = useQuery<Occasion>({
    queryKey: ['occasion', id],
    queryFn: async () => {
      const response = await api.get(`/occasions/${id}/`);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<OccasionMessage[]>({
    queryKey: ['occasionMessages', id],
    queryFn: async () => {
      // List endpoints are paginated ({count, next, previous, results}); unwrap to the array.
      const response = await api.get(`/occasions/${id}/messages/`);
      return response.data.results;
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/occasions/${id}/messages/${messageId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occasionMessages', id] });
      queryClient.invalidateQueries({ queryKey: ['occasion', id] });
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to delete message.')),
  });

  const hideMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await api.patch(`/occasions/${id}/messages/${messageId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occasionMessages', id] });
    },
    onError: (err: unknown) => setError(getErrorMessage(err, 'Failed to update message.')),
  });

  const handleDelete = (messageId: string) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    setError('');
    deleteMutation.mutate(messageId);
  };

  const handleCopyLink = async () => {
    if (!occasion) return;
    // public_url comes back as a path relative to the frontend (e.g. /wishes/some-slug),
    // so resolve it against the current origin before copying it anywhere outside the app.
    const absoluteUrl = new URL(occasion.public_url, window.location.origin).toString();
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || isLoading) return <div className={styles.loading}>Loading...</div>;
  if (!occasion) return <div className={styles.loading}>Occasion not found.</div>;

  return (
    <div className={styles.container}>
      <main className={`container ${styles.main}`}>
        <Link href="/dashboard" className={styles.backBtn}>&larr; Back to dashboard</Link>

        <div className={`${styles.headerCard} glass`}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>{occasion.title}</h1>
              <p className={styles.subtitle}>For {occasion.person_full_name}</p>
            </div>
            <span className={`${styles.statusBadge} ${styles[occasion.status]}`}>{occasion.status}</span>
          </div>

          <div className={styles.linkRow}>
            <input
              readOnly
              value={new URL(occasion.public_url, window.location.origin).toString()}
              className={styles.linkInput}
              onFocus={(e) => e.target.select()}
              aria-label="Public link"
            />
            <button onClick={handleCopyLink} className={styles.btnSecondary} type="button">
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <Link href={`/dashboard/occasions/${id}/settings`} className={styles.btnSecondary}>
              Settings & Media
            </Link>
            <a href={new URL(occasion.public_url, window.location.origin).toString()} target="_blank" rel="noopener noreferrer" className={styles.btnOutline}>
              View Public Page
            </a>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{occasion.message_count}</span>
              <span className={styles.statLabel}>Messages</span>
            </div>
          </div>
        </div>

        <div className={styles.messagesSection}>
          <h2 className={styles.sectionTitle}>Messages Received</h2>
          {error && <div className={styles.error}>{error}</div>}

          {messagesLoading ? (
            <div className={styles.loading}>Loading messages...</div>
          ) : messages?.length === 0 ? (
            <div className={`${styles.emptyState} glass`}>
              <p>No messages yet. Share your public link to start collecting wishes.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sender</th>
                    <th>Relationship</th>
                    <th>Message</th>
                    <th>Media</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages?.map((msg) => {
                    const audioMedia = msg.media?.find(m => m.media_type === 'AUDIO');
                    const hasVisualMedia = msg.media?.some(m => m.media_type === 'IMAGE' || m.media_type === 'VIDEO');
                    
                    return (
                      <tr key={msg.id} className={msg.is_hidden ? styles.rowHidden : ''}>
                        <td className={styles.senderCell}>
                          {msg.sender_full_name}
                          {msg.is_hidden && <span className={styles.hiddenBadge}>Hidden</span>}
                        </td>
                        <td className={styles.relCell}>{msg.relationship || '-'}</td>
                        <td className={styles.msgCell}>
                          <div className={styles.msgTruncate}>{msg.message || '-'}</div>
                        </td>
                        <td className={styles.mediaCell}>
                          <div className={styles.mediaIcons}>
                            {audioMedia && (
                              <audio controls src={audioMedia.url} className={styles.inlineAudio} />
                            )}
                            {hasVisualMedia && (
                              <button 
                                onClick={() => setSelectedMessage(msg)}
                                className={styles.btnViewMedia}
                              >
                                View Media
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={styles.dateCell}>{new Date(msg.created_at).toLocaleDateString()}</td>
                        <td className={styles.actionCell}>
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className={styles.btnOutline}
                            type="button"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => hideMutation.mutate(msg.id)}
                            className={msg.is_hidden ? styles.btnUnhide : styles.btnHide}
                            disabled={hideMutation.isPending}
                            type="button"
                            title={msg.is_hidden ? 'Make visible on public page' : 'Hide from public page'}
                          >
                            {msg.is_hidden ? 'Unhide' : 'Hide'}
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className={styles.btnDanger}
                            disabled={deleteMutation.isPending}
                            type="button"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Side Panel for Message Details */}
      {selectedMessage && (
        <>
          <div className={styles.overlay} onClick={() => setSelectedMessage(null)} />
          <aside className={styles.sidePanel}>
            <div className={styles.sidePanelHeader}>
              <h2>Message Details</h2>
              <button onClick={() => setSelectedMessage(null)} className={styles.btnClose}>&times;</button>
            </div>
            <div className={styles.sidePanelContent}>
              <div className={styles.detailGroup}>
                <h3>From</h3>
                <p>{selectedMessage.sender_full_name} {selectedMessage.relationship && `(${selectedMessage.relationship})`}</p>
              </div>
              
              <div className={styles.detailGroup}>
                <h3>Message</h3>
                <div className={styles.fullMessage}>
                  {selectedMessage.message ? <p>{selectedMessage.message}</p> : <p className={styles.textMuted}>No text message.</p>}
                </div>
              </div>

              {selectedMessage.media?.length > 0 && (
                <div className={styles.detailGroup}>
                  <h3>Attachments</h3>
                  <div className={styles.mediaGallery}>
                    {selectedMessage.media.map((media) => (
                      <div key={media.id} className={styles.mediaItem}>
                        {media.media_type === 'IMAGE' && (
                          <img src={media.url} alt="Attachment" className={styles.mediaImage} />
                        )}
                        {media.media_type === 'VIDEO' && (
                          <video src={media.url} controls className={styles.mediaVideo} />
                        )}
                        {media.media_type === 'AUDIO' && (
                          <audio src={media.url} controls className={styles.mediaAudioFull} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
