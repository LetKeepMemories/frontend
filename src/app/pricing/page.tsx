'use client';

import styles from './page.module.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  billing_cycle: string;
  max_images_count: number;
  max_video_count: number;
  max_audio_count: number;
  max_storage: number;
  allow_video: boolean;
  allow_audio_message: boolean;
  max_video_size: number;
}

export default function PricingPage() {
  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans/');
      return response.data;
    },
  });

  // With 2+ plans, the first paid tier (second-cheapest) is the
  // conventional "Most Popular" highlight; with only one plan, nothing
  // needs to stand out.
  const sortedPlans = plans ? [...plans].sort((a, b) => parseFloat(a.price) - parseFloat(b.price)) : [];
  const popularPlanId = sortedPlans.length >= 2 ? sortedPlans[1].id : null;

  return (
    <div className={styles.container}>
      <main className={`container ${styles.main}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Simple, Transparent Pricing</h1>
          <p className={styles.subtitle}>
            Choose the perfect plan to collect and preserve memories forever.
          </p>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading plans...</div>
        ) : sortedPlans.length === 0 ? (
          <div className={styles.loading}>No plans are available right now. Check back soon.</div>
        ) : (
          <div className={styles.grid} data-count={sortedPlans.length}>
            {sortedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`${styles.card} glass ${plan.id === popularPlanId ? styles.cardPopular : ''}`}
              >
                {plan.id === popularPlanId && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.priceWrapper}>
                  <span className={styles.currency}>$</span>
                  <span className={styles.price}>{parseFloat(plan.price)}</span>
                  <span className={styles.cycle}>/{plan.billing_cycle === 'yearly' ? 'yr' : 'mo'}</span>
                </div>

                <ul className={styles.featuresList}>
                  <li className={styles.featureItem}>
                    <Check size={18} className={styles.featureIcon} />
                    <span><strong>{plan.max_images_count}</strong> Photos per occasion</span>
                  </li>
                  <li className={styles.featureItem}>
                    <Check size={18} className={styles.featureIcon} />
                    <span><strong>{plan.max_storage} MB</strong> Total storage space</span>
                  </li>

                  {plan.allow_video ? (
                    <li className={styles.featureItem}>
                      <Check size={18} className={styles.featureIcon} />
                      <span><strong>{plan.max_video_count}</strong> Videos (Up to {plan.max_video_size} MB each)</span>
                    </li>
                  ) : (
                    <li className={`${styles.featureItem} ${styles.featureDisabled}`}>
                      <X size={18} className={styles.featureIconDisabled} />
                      <span>Video uploads</span>
                    </li>
                  )}

                  {plan.allow_audio_message ? (
                    <li className={styles.featureItem}>
                      <Check size={18} className={styles.featureIcon} />
                      <span><strong>{plan.max_audio_count}</strong> Voice messages</span>
                    </li>
                  ) : (
                    <li className={`${styles.featureItem} ${styles.featureDisabled}`}>
                      <X size={18} className={styles.featureIconDisabled} />
                      <span>Voice messages</span>
                    </li>
                  )}
                </ul>

                <Link href="/signup" className={plan.id === popularPlanId ? styles.btnPrimary : styles.btnOutline}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
