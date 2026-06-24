import Link from 'next/link';
import styles from './page.module.css';
import ThemedIcon from '@/components/ui/ThemedIcon';

export default function Home() {
  return (
    <>
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroContainer}`}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Celebrate Life&apos;s Most <span>Precious Memories</span>
              </h1>
              <p className={styles.heroSubtitle}>
                A digital memory and celebration platform. Preserve life moments, celebrate milestones, and create lasting digital collections of messages, images, videos, and voice memories.
              </p>
              <div className={styles.heroActions}>
                <Link href="/signup" className={styles.btnPrimary}>
                  Start a Collection
                </Link>
                <Link href="/about" className={styles.btnOutline}>
                  Learn More
                </Link>
              </div>
            </div>
            <div className={styles.heroImageContainer}>
              {/* Using CSS to simulate an image placeholder or illustration since we might not have a hero image yet. But a great landing page uses abstract shapes or images. */}
              <div className={styles.abstractShape1}></div>
              <div className={styles.abstractShape2}></div>
              <div className={`${styles.glassCard} glass`}>
                <div className={styles.mockupHeader}>
                  <ThemedIcon />
                  <div>
                    <h4>Happy 50th, John!</h4>
                    <p>32 Messages &bull; 15 Photos</p>
                  </div>
                </div>
                <div className={styles.mockupBody}>
                  &ldquo;Wishing you the best on your golden jubilee! We love you!&rdquo;
                  <br /><br />
                  - Sarah &amp; Tom
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.features}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Why Lets Keep Memories?</h2>
              <p>Everything you need to create a beautiful, lasting tribute.</p>
            </div>
            <div className={styles.featureGrid}>
              <div className={`${styles.featureCard} glass`}>
                <div className={styles.featureIcon}>📸</div>
                <h3>Rich Media Support</h3>
                <p>Upload photos, videos, and soon voice notes to make your memories truly come alive.</p>
              </div>
              <div className={`${styles.featureCard} glass`}>
                <div className={styles.featureIcon}>🌐</div>
                <h3>Easy Sharing</h3>
                <p>Generate a simple public link to collect wishes from friends and family worldwide.</p>
              </div>
              <div className={`${styles.featureCard} glass`}>
                <div className={styles.featureIcon}>🔒</div>
                <h3>Private & Secure</h3>
                <p>You control who can see and contribute to your memory collections.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.cta}>
          <div className="container">
            <div className={styles.ctaCard}>
              <h2>Ready to preserve a memory?</h2>
              <p>Join thousands of others who trust Lets Keep Memories for their special occasions.</p>
              <Link href="/signup" className={styles.btnPrimaryLarge}>
                Create Your Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
