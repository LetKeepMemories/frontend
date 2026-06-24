'use client';

import styles from './page.module.css';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAuth } from '@/hooks/useAuth';

interface Subscription {
  plan: {
    id: number;
    name: string;
    billing_cycle: string;
    max_images_count: number;
    max_video_count: number;
    max_audio_count: number;
  };
  status: string;
  start_date: string | null;
  end_date: string | null;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  price: string;
  billing_cycle: string;
  max_images_count: number;
  max_video_count: number;
  max_audio_count: number;
  max_storage: number;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  const [otpStep, setOtpStep] = useState<'idle' | 'sent'>('idle');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { requestPasswordChangeOtp, isRequestingPasswordChangeOtp, confirmPasswordChangeOtp, isConfirmingPasswordChangeOtp } = useAuth();

  const [loadedUser, setLoadedUser] = useState<typeof user | null>(null);
  if (user && user !== loadedUser) {
    setLoadedUser(user);
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
  }

  const { data: subscription, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/me/');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const { data: availablePlans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans/');
      return response.data;
    },
    enabled: isAuthenticated,
  });

  const [isInitializingPayment, setIsInitializingPayment] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState('');

  const handleUpgrade = async (planId: number) => {
    setIsInitializingPayment(planId);
    setPaymentError('');
    try {
      const response = await api.post('/payments/initialize/', { plan_id: planId });
      if (response.data.authorization_url) {
        window.location.assign(response.data.authorization_url);
      }
    } catch (err: unknown) {
      setPaymentError(getErrorMessage(err, 'Failed to initialize payment.'));
      setIsInitializingPayment(null);
      setTimeout(() => setPaymentError(''), 5000);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await api.patch('/auth/me/', {
        first_name: firstName,
        last_name: lastName,
      });
      setSuccess('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');
    setIsEmailSubmitting(true);

    try {
      const response = await api.post('/auth/change-email/', { new_email: newEmail });
      setSecuritySuccess(response.data.detail || 'Email updated. Please check your new inbox.');
      // After a short delay, redirect to login since they are logged out
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err: unknown) {
      setSecurityError(getErrorMessage(err, 'Failed to update email.'));
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleRequestOtp = async () => {
    setSecurityError('');
    setSecuritySuccess('');
    try {
      await requestPasswordChangeOtp();
      setOtpStep('sent');
      setSecuritySuccess(`We sent a 6-digit code to ${user?.email}.`);
    } catch (err: unknown) {
      setSecurityError(getErrorMessage(err, 'Failed to send verification code.'));
    }
  };

  const handleConfirmOtp = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');
    try {
      await confirmPasswordChangeOtp({ code: otpCode, new_password: newPassword });
      setSecuritySuccess('Password changed successfully.');
      setOtpStep('idle');
      setOtpCode('');
      setNewPassword('');
    } catch (err: unknown) {
      setSecurityError(getErrorMessage(err, 'Invalid or expired code.'));
    }
  };

  if (authLoading) return <div className={styles.loading}>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div className={styles.container}>
      {paymentError && <div className={styles.toastError}>{paymentError}</div>}
      <main className={`container ${styles.main}`}>
        <h1 className={styles.pageTitle}>My Profile</h1>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'security' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {activeTab === 'profile' ? (
          <>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Account Details</h2>
              
              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className={styles.inputGroup}>
                  <label>Email Address</label>
                  <input type="text" value={user?.email || ''} disabled className={styles.input} style={{ opacity: 0.6 }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label>First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={styles.input} />
                  </div>
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label>Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={styles.input} />
                  </div>
                </div>

                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Active Subscription</h2>
              
              {subLoading ? (
                <div>Loading subscription...</div>
              ) : subscription ? (
                <div className={styles.planCard}>
                  <div className={styles.planName}>{subscription.plan.name} Plan</div>
                  <div className={styles.planDetail}>
                    <span>Status</span>
                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{subscription.status}</span>
                  </div>
                  <div className={styles.planDetail}>
                    <span>Billing Cycle</span>
                    <span style={{ textTransform: 'capitalize' }}>{subscription.plan.billing_cycle}</span>
                  </div>
                  <div className={styles.planDetail}>
                    <span>Renews</span>
                    <span>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'No end date'}</span>
                  </div>

                  <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Your Plan Limits</h4>
                    <div className={styles.planDetail} style={{ borderBottom: 'none' }}>
                      <span>Images</span>
                      <span>{subscription.plan.max_images_count} uploads</span>
                    </div>
                    <div className={styles.planDetail} style={{ borderBottom: 'none' }}>
                      <span>Videos</span>
                      <span>{subscription.plan.max_video_count} uploads</span>
                    </div>
                    <div className={styles.planDetail} style={{ borderBottom: 'none' }}>
                      <span>Audio</span>
                      <span>{subscription.plan.max_audio_count} uploads</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You do not have an active subscription.</div>
              )}

              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Available Plans</h3>
                <p style={{ color: 'var(--text-muted)' }}>Upgrade your account to unlock more storage and premium features.</p>
                
                {plansLoading ? (
                  <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading plans...</div>
                ) : (
                  <div className={styles.plansGrid}>
                    {availablePlans?.map((plan) => {
                      const isCurrentPlan = subscription?.plan?.id === plan.id;
                      
                      return (
                        <div key={plan.id} className={styles.planCardAvailable} style={{ borderColor: isCurrentPlan ? 'var(--primary)' : '' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{plan.name}</h4>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                ₦{parseFloat(plan.price).toLocaleString()}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                / {plan.billing_cycle}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Photos</span> <span>{plan.max_images_count} uploads</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Videos</span> <span>{plan.max_video_count} uploads</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Voice Notes</span> <span>{plan.max_audio_count} uploads</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleUpgrade(plan.id)}
                            className={isCurrentPlan ? styles.btnOutline : styles.btnPrimary}
                            style={{ width: '100%', marginTop: 'auto', padding: '0.75rem' }}
                            disabled={isCurrentPlan || isInitializingPayment === plan.id}
                          >
                            {isCurrentPlan ? 'Current Plan' : isInitializingPayment === plan.id ? 'Processing...' : 'Upgrade Now'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle} style={{ color: 'var(--danger)' }}>Security Settings</h2>
            
            {securityError && <div className={styles.error}>{securityError}</div>}
            {securitySuccess && <div className={styles.success}>{securitySuccess}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Change Email */}
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Change Email Address</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Updating your email address will immediately log you out. You must verify your new email address before logging back in.
                </p>
                <form onSubmit={handleEmailChange} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label>New Email Address</label>
                    <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className={styles.input} />
                  </div>
                  <button type="submit" className={styles.btnPrimary} style={{ margin: 0, padding: '0.75rem 1.5rem' }} disabled={isEmailSubmitting}>
                    {isEmailSubmitting ? 'Updating...' : 'Update Email'}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>Change Password</h3>
                {otpStep === 'idle' ? (
                  <>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                      For your security, changing your password requires a one-time code. We&apos;ll send it to <strong>{user?.email}</strong>.
                    </p>
                    <button
                      onClick={handleRequestOtp}
                      className={styles.btnPrimary}
                      style={{ margin: 0, alignSelf: 'flex-start' }}
                      disabled={isRequestingPasswordChangeOtp}
                    >
                      {isRequestingPasswordChangeOtp ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleConfirmOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                      Enter the 6-digit code we sent to <strong>{user?.email}</strong> along with your new password.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>Verification Code</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          required
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup} style={{ flex: 1 }}>
                        <label>New Password</label>
                        <input
                          type="password"
                          minLength={10}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className={styles.input}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button type="submit" className={styles.btnPrimary} style={{ margin: 0 }} disabled={isConfirmingPasswordChangeOtp}>
                        {isConfirmingPasswordChangeOtp ? 'Changing...' : 'Confirm New Password'}
                      </button>
                      <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={() => { setOtpStep('idle'); setOtpCode(''); setNewPassword(''); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={handleRequestOtp}
                        disabled={isRequestingPasswordChangeOtp}
                      >
                        Resend code
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
