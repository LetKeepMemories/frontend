'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import styles from './layout.module.css';

interface EventType {
  id: string;
  name: string;
  slug: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const DJANGO_ADMIN_URL = `${API_BASE_URL.replace(/\/api\/?$/, '')}/admin`;

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users & Subscriptions' },
  { href: '/admin/plans', label: 'Subscription Plans' },
  { href: '/admin/config', label: 'Admin Upload Limits' },
  { href: '/admin/revenue', label: 'Revenue & Payments' },
  { href: '/admin/event-types', label: 'Event Types' },
  { href: '/admin/occasions', label: 'All Occasions' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type');
  const { user } = useAuth();

  const { data: eventTypes, isLoading } = useQuery<EventType[]>({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const response = await api.get('/event-types/');
      return response.data;
    },
  });

  return (
    <aside className={`${styles.sidebar} glass`}>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <h2>Dashboard</h2>
          </Link>
        </div>
        <nav className={styles.nav}>
          {user?.user_type === 'admin' && (
            <>
              <div className={styles.navSectionTitle} style={{ color: 'var(--primary)' }}>Admin Portal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(99, 102, 241, 0.2)' }}>
                {ADMIN_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}
                  >
                    {link.label}
                  </Link>
                ))}
                <a
                  href={DJANGO_ADMIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.navLink}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}
                >
                  Django Admin &rarr;
                </a>
              </div>
            </>
          )}

          <div className={styles.navSectionTitle}>My Workspace</div>
          {isLoading ? (
            <div className={styles.loadingNav}>Loading types...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link 
                href="/dashboard"
                className={`${styles.navLink} ${pathname === '/dashboard' && !activeType ? styles.active : ''}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}
              >
                All Occasions
              </Link>
              {eventTypes?.map((type) => (
                <Link 
                  key={type.id}
                  href={`/dashboard?type=${type.slug}`}
                  className={`${styles.navLink} ${activeType === type.slug ? styles.active : ''}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}
                >
                  {type.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <Link href="/dashboard/profile" className={styles.userCard}>
          <div className={styles.userAvatar}>
            {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : 'My Profile'}
            </span>
            {user?.email && <span className={styles.userEmail}>{user.email}</span>}
          </div>
        </Link>
      </div>
    </aside>
  );
}
