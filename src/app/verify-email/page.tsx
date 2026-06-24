'use client';

import styles from '../login/page.module.css';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [resendSent, setResendSent] = useState(false);
  const { verifyEmail, isVerifyingEmail, resendVerification, isResendingVerification } = useAuth();

  const handleVerify = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await verifyEmail({ email, code });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired code.'));
    }
  };

  const handleResend = async () => {
    setError('');
    setResendSent(false);
    try {
      await resendVerification(email);
      setResendSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to resend verification code.'));
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.icon}>✉️</div>
        <h1 className={styles.title}>Check your inbox</h1>
        <p className={styles.subtitle}>
          {email ? <>We sent a 6-digit code to <strong>{email}</strong>.</> : 'Enter your email and the code we sent you.'}
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {resendSent && <div className={styles.success}>A new code has been sent.</div>}

        <form onSubmit={handleVerify} className={styles.form}>
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
          <div className={styles.inputGroup}>
            <label htmlFor="code">Verification Code</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              className={styles.input}
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={isVerifyingEmail || code.length !== 6}>
            {isVerifyingEmail ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className={styles.footer}>
          Didn&apos;t get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResendingVerification || !email}
            style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            {isResendingVerification ? 'Sending...' : 'Resend code'}
          </button>
        </div>
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
