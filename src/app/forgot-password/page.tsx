'use client';

import styles from '../login/page.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { requestPasswordReset, isRequestingPasswordReset } = useAuth();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send reset instructions.'));
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Reset your password</h1>
        <p className={styles.subtitle}>We&apos;ll email you a link to choose a new one.</p>

        {error && <div className={styles.error}>{error}</div>}
        {sent ? (
          <div className={styles.success}>
            If an account exists for that email, password reset instructions have been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={isRequestingPasswordReset}>
              {isRequestingPasswordReset ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <Link href="/login">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
