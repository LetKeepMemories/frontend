'use client';

import styles from './page.module.css';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
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
                <div className={styles.cardActions}>
                  <Link href={`/dashboard/occasions/${occ.id}`} className={styles.btnSecondary}>
                    Manage
                  </Link>
                  <a href={occ.public_url} target="_blank" rel="noopener noreferrer" className={styles.btnOutline}>
                    View Public
                  </a>
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
