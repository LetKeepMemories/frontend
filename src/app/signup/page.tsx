'use client';

import styles from '../login/page.module.css';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/errors';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { signup, isSigningUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await signup({ first_name: firstName, last_name: lastName, email, password });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Signup failed. Please try again later.'));
    }
  };

  return (
    <main className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join Lets Keep Memories today</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.nameRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className={styles.input}
              />
            </div>
          </div>
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
                minLength={10}
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
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={10}
                className={styles.input}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={isSigningUp}>
            {isSigningUp ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
