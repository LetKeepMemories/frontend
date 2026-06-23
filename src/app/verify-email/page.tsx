'use client';

import styles from '../login/page.module.css';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [status, setStatus] = useState<'checking-inbox' | 'verifying' | 'failed'>(
    uid && token ? 'verifying' : 'checking-inbox'
  );
  const [error, setError] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const { verifyEmail, resendVerification, isResendingVerification } = useAuth();

  useEffect(() => {
    if (!uid || !token) return;
    verifyEmail({ uid, token })
      .then(() => router.push('/dashboard'))
      .catch((err: unknown) => {
        setError(getErrorMessage(err, 'This verification link is invalid or has expired.'));
        setStatus('failed');
      });
    // Only run once on mount for this uid/token pair.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, token]);

  const handleResend = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await resendVerification(email);
      setResendSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend verification email.'));
    }
  };

  if (status === 'verifying') {
    return (
      <main className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.icon}>✉️</div>
          <h1 className={styles.title}>Verifying your email&hellip;</h1>
          <p className={styles.subtitle}>Hang tight, this only takes a second.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.icon}>{status === 'failed' ? '⚠️' : '✉️'}</div>
        <h1 className={styles.title}>{status === 'failed' ? 'Link expired' : 'Check your inbox'}</h1>
        <p className={styles.subtitle}>
          {status === 'failed'
            ? 'That verification link is invalid or has expired. Enter your email to get a new one.'
            : email
            ? <>We sent a verification link to <strong>{email}</strong>. Click it to activate your account.</>
            : 'We sent you a verification link. Click it to activate your account.'}
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {resendSent && <div className={styles.success}>Verification email sent! Check your inbox.</div>}

        <form onSubmit={handleResend} className={styles.form}>
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
          <button type="submit" className={styles.btnPrimary} disabled={isResendingVerification}>
            {isResendingVerification ? 'Sending...' : 'Resend verification email'}
          </button>
        </form>

        <div className={styles.footer}>
          Already verified? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className={styles.authContainer} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
