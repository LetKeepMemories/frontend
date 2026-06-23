'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import styles from '../profile/page.module.css'; // Reusing profile styles for loading/errors

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Prevent double-calls in strict mode
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const verify = async () => {
      if (!reference) {
        setStatus('error');
        setErrorMsg('No payment reference provided.');
        return;
      }

      hasVerified.current = true;
      try {
        await api.post('/payments/verify/', { reference });
        setStatus('success');

        // Short delay so they can read the success message before redirecting
        setTimeout(() => {
          router.push('/dashboard/profile');
        }, 2000);
      } catch (err: unknown) {
        setStatus('error');
        setErrorMsg(getErrorMessage(err, 'Failed to verify payment with Paystack.'));
      }
    };

    verify();
  }, [reference, router]);

  return (
    <div className={styles.container}>
      <main className={`container ${styles.main}`} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className={styles.sectionCard} style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          
          {status === 'verifying' && (
            <>
              <h2 className={styles.sectionTitle} style={{ border: 'none', justifyContent: 'center' }}>Verifying Payment...</h2>
              <p style={{ color: 'var(--text-muted)' }}>Please wait while we confirm your transaction with Paystack.</p>
              <div className={styles.loading} style={{ padding: '2rem' }}>Processing...</div>
            </>
          )}

          {status === 'success' && (
            <>
              <h2 className={styles.sectionTitle} style={{ border: 'none', justifyContent: 'center', color: 'var(--success)' }}>Payment Successful!</h2>
              <div className={styles.success} style={{ marginBottom: '1rem' }}>
                Your subscription has been upgraded successfully.
              </div>
              <p style={{ color: 'var(--text-muted)' }}>Redirecting to your profile...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <h2 className={styles.sectionTitle} style={{ border: 'none', justifyContent: 'center', color: 'var(--danger)' }}>Verification Failed</h2>
              <div className={styles.error} style={{ marginBottom: '1.5rem' }}>
                {errorMsg}
              </div>
              <button onClick={() => router.push('/dashboard/profile')} className={styles.btnPrimary}>
                Return to Profile
              </button>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPaymentContent />
    </Suspense>
  );
}
