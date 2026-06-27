'use client';

import styles from './page.module.css';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface EventType {
  slug: string;
  name: string;
}

interface Occasion {
  id: string;
  title: string;
  slug: string;
  public_url: string;
  status: string;
  person_first_name: string;
  person_last_name: string;
  created_at: string;
  event_type: EventType;
  message_count: number;
}

interface Subscription {
  plan: {
    name: string;
    max_images_count: number;
    max_storage: number;
  };
  status: string;
  start_date: string | null;
  end_date: string | null;
}

function DashboardContent() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: occasions, isLoading: occasionsLoading } = useQuery<Occasion[]>({
    queryKey: ['occasions'],
    queryFn: async () => {
      const response = await api.get('/occasions/');
      return response.data.results;
    },
    enabled: isAuthenticated,
  });

  const { data: subscription, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/me/');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) return <div className={styles.loading}>Loading...</div>;

  const filteredOccasions = activeType 
    ? occasions?.filter(occ => occ.event_type?.slug === activeType)
    : occasions;

  // Stats reflect the active filter: all occasions when no type is selected,
  // or only the occasions for the selected event type.
  const statSource = filteredOccasions;
  const totalOccasions = statSource?.length ?? 0;
  const publishedCount = statSource?.filter(o => o.status === 'published').length ?? 0;
  const draftCount = statSource?.filter(o => o.status === 'draft').length ?? 0;
  const totalMessages = statSource?.reduce((sum, o) => sum + (o.message_count ?? 0), 0) ?? 0;

  const handleCopyLink = (occ: Occasion) => {
    // Copy the full absolute URL to clipboard
    const absoluteUrl = new URL(occ.public_url, window.location.origin).toString();
    navigator.clipboard.writeText(absoluteUrl).then(() => {
      setCopiedId(occ.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className={styles.dashboard}>
      <main className={`container ${styles.main}`}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Your Occasions</h1>
            <div className={styles.userInfo}>
              Welcome back, {user?.first_name}
              {!subLoading && subscription && (
                <span className={styles.badge}>{subscription.plan.name}</span>
              )}
            </div>
          </div>
          <Link href={`/dashboard/create${activeType ? `?type=${activeType}` : ''}`} className={styles.btnPrimary}>
            + Create New Occasion
          </Link>
        </div>

        {/* Stats Overview */}
        {!occasionsLoading && occasions && occasions.length > 0 && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalOccasions}</span>
              <span className={styles.statLabel}>{activeType ? 'Occasions (this type)' : 'Total Occasions'}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalMessages}</span>
              <span className={styles.statLabel}>Messages Received</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{publishedCount}</span>
              <span className={styles.statLabel}>Published</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{draftCount}</span>
              <span className={styles.statLabel}>Drafts</span>
            </div>
          </div>
        )}

        {occasionsLoading ? (
          <div className={styles.loading}>Loading your memories...</div>
        ) : filteredOccasions?.length === 0 ? (
          <div className={`${styles.emptyState} glass`}>
            <h3>No occasions found</h3>
            <p>Create your first digital memory collection to start celebrating.</p>
            <Link href={`/dashboard/create${activeType ? `?type=${activeType}` : ''}`} className={styles.btnPrimary} style={{ marginTop: '1rem' }}>
              Create Occasion
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredOccasions?.map((occ) => (
              <div key={occ.id} className={`${styles.card} glass`}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{occ.title}</h3>
                  <span className={`${styles.statusBadge} ${styles[occ.status]}`}>{occ.status}</span>
                </div>
                <p className={styles.cardSubtitle}>
                  For {occ.person_first_name} {occ.person_last_name}
                </p>
                <div className={styles.messageBadge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {occ.message_count ?? 0} {(occ.message_count ?? 0) === 1 ? 'message' : 'messages'}
                </div>
                <div className={styles.cardActions}>
                  <Link href={`/dashboard/occasions/${occ.id}`} className={styles.btnSecondary}>
                    Manage
                  </Link>
                </div>
                <div className={styles.publicLinkRow}>
                  <a
                    
                    href={new URL(occ.public_url, window.location.origin).toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.publicLinkPreview}
                    title={new URL(occ.public_url, window.location.origin).toString()}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    <span>{new URL(occ.public_url, window.location.origin).toString()}</span>
                  </a>
                  <button
                    onClick={() => handleCopyLink(occ)}
                    className={copiedId === occ.id ? styles.btnCopied : styles.btnCopy}
                    title="Copy public link to clipboard"
                  >
                    {copiedId === occ.id ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Share Public Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
