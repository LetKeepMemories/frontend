'use client';

import styles from '../login/page.module.css';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { confirmPasswordReset, isConfirmingPasswordReset } = useAuth();

  if (!uid || !token) {
    return (
      <main className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>Invalid link</h1>
          <p className={styles.subtitle}>
            This password reset link is missing required information. Request a new one below.
          </p>
          <div className={styles.footer}>
            <Link href="/forgot-password">Request a new link</Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await confirmPasswordReset({ uid, token, new_password: newPassword });
      router.push('/login?reset=success');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'This reset link is invalid or has expired.'));
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Choose a new password</h1>
        <p className={styles.subtitle}>Make it something you haven&apos;t used before.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={10}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={10}
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={isConfirmingPasswordReset}>
            {isConfirmingPasswordReset ? 'Saving...' : 'Reset Password'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className={styles.authContainer} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
