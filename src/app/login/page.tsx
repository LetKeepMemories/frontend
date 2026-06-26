'use client';

import styles from './page.module.css';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

function ResetSuccessBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('reset') !== 'success') return null;
  return <div className={styles.success}>Your password has been reset. Sign in below.</div>;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoggingIn, googleLogin, isGoogleSigningIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: unknown) {
      if (getErrorCode(err) === 'email_not_verified') {
        // Verification screen has its own "Resend code" button — we don't
        // send a code here, just get them to where they can ask for one.
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(getErrorMessage(err, 'Login failed. Please check your credentials.'));
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to Lets Keep Memories</p>

        <Suspense fallback={null}>
          <ResetSuccessBanner />
        </Suspense>

        {error && <div className={styles.error}>{error}</div>}

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
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div className={styles.linkRow}>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
<button type="submit" className={styles.btnPrimary} disabled={isLoggingIn || isGoogleSigningIn}>
  {isLoggingIn || isGoogleSigningIn ? 'Signing In...' : 'Sign In'}
</button>
<div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
  <GoogleLogin
    onSuccess={async (credentialResponse) => {
      if (credentialResponse.credential) {
        try {
          await googleLogin(credentialResponse.credential);
          router.push('/dashboard');
        } catch (err) {
          setError(getErrorMessage(err, 'Google Sign In failed.'));
        }
      }
    }}
    onError={() => {
      setError('Google Sign In failed.');
    }}
  />
</div>
        </form>

        <div className={styles.footer}>
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </div>
      </div>
    </main>
  );
}
