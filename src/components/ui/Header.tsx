'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes' documented pattern: resolvedTheme is unknown until after
  // hydration, so we can't derive this during render -- it has to be an Effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Close the mobile menu on navigation without an Effect (React docs:
  // adjusting state during render instead of resetting it in an Effect).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsMenuOpen(false);
  }

  const initials = user
    ? `${user.first_name?.charAt(0) ?? ''}${user.last_name?.charAt(0) ?? ''}`.toUpperCase()
    : '';

  return (
    <header className={`${styles.header} glass`}>
      <div className={`container ${styles.container}`}>
        <Link href="/" className={styles.logoLink}>
          {/* <picture><source media="prefers-color-scheme"> can't see next-themes'
              data-theme attribute, so a manual toggle would silently stop updating
              the logo — render straight off resolvedTheme instead. */}
          <Image
            src={mounted && resolvedTheme === 'dark' ? '/logos/back_mode.png' : '/logos/light_full.png'}
            alt="Lets Keep Memories Logo"
            width={mounted && resolvedTheme === 'dark' ? 120 : 350}
            height={120}
            className={styles.logo}
            priority
          />
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`}>
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className={styles.themeToggle}
              aria-label="Toggle Dark Mode"
              title="Toggle Dark Mode"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)'
              }}
            >
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          {isAuthenticated ? (
            <>
              <div className={styles.userMenu}>
                <Link
                  href="/dashboard/profile"
                  className={styles.userAvatar}
                  title={user ? `${user.first_name} ${user.last_name}` : 'Profile'}
                >
                  {initials}
                </Link>
                <button onClick={() => logout()} className={styles.btnOutline}>Log Out</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLink}>Log In</Link>
              <Link href="/signup" className={styles.btnPrimary}>Get Started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
