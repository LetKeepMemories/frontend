'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import styles from './layout.module.css';

interface EventType {
  id: string;
  name: string;
  slug: string;
}

// NEXT_PUBLIC_API_URL is "/api" (proxied through this same origin), so the
// Django admin link needs the backend's actual domain separately — it's a
// real page navigation, not a fetch, so it isn't subject to the cross-origin
// cookie issues the API proxy works around.
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:8000';
const DJANGO_ADMIN_URL = `${BACKEND_ORIGIN}/admin`;

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
  const [isOpen, setIsOpen] = useState(false);

  const { data: eventTypes, isLoading } = useQuery<EventType[]>({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const response = await api.get('/event-types/');
      return response.data;
    },
  });

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} glass`}>
      {/* Header is always visible — contains the hamburger on mobile */}
      <div className={styles.sidebarHeader}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
          <h2>Dashboard</h2>
        </Link>
        <button
          className={styles.sidebarToggle}
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          type="button"
        >
          {isOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nav — hidden on mobile until hamburger is tapped */}
      <div className={styles.sidebarContent}>
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
                    onClick={() => setIsOpen(false)}
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

          <div className={styles.navSectionTitle}>My Occasions</div>
          {isLoading ? (
            <div className={styles.loadingNav}>Loading types...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Link
                href="/dashboard"
                className={`${styles.navLink} ${pathname === '/dashboard' && !activeType ? styles.active : ''}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}
                onClick={() => setIsOpen(false)}
              >
                All Occasions
              </Link>
              {eventTypes?.map((type) => (
                <Link
                  key={type.id}
                  href={`/dashboard?type=${type.slug}`}
                  className={`${styles.navLink} ${activeType === type.slug ? styles.active : ''}`}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}
                  onClick={() => setIsOpen(false)}
                >
                  {type.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className={styles.sidebarFooter}>
        <Link href="/dashboard/profile" className={styles.userCard} onClick={() => setIsOpen(false)}>
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
