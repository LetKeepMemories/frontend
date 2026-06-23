import Link from 'next/link';
import styles from '@/styles/staticPage.module.css';

export const metadata = {
  title: 'Features — Lets Keep Memories',
};

const FEATURES = [
  {
    icon: '📸',
    title: 'Rich media messages',
    description: 'Guests can leave a written message alongside photos, videos, and voice notes — no account needed.',
  },
  {
    icon: '🌐',
    title: 'One shareable link',
    description: 'Every occasion gets a public link you can drop in a text, email, or group chat to start collecting wishes.',
  },
  {
    icon: '🔒',
    title: 'Private & secure',
    description: 'Only you can manage your occasion. Guests can contribute, but only the owner can edit or remove content.',
  },
  {
    icon: '🗂️',
    title: 'A dashboard for every occasion',
    description: 'Create as many occasions as you need and manage each one — messages, status, and sharing — from one place.',
  },
  {
    icon: '🛡️',
    title: 'Moderation built in',
    description: "Review every message left on your occasion and remove anything that doesn't belong.",
  },
  {
    icon: '🎉',
    title: 'Built for every milestone',
    description: 'Birthdays, weddings, anniversaries, memorials — pick the occasion type that fits.',
  },
];

export default function Features() {
  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <h1>Everything you need to celebrate a moment</h1>
          <p>A focused set of tools for collecting and preserving messages from the people who matter.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.grid}>
            {FEATURES.map((feature) => (
              <div key={feature.title} className={`${styles.card} glass`}>
                <div className={styles.icon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
          <div className={styles.ctaRow}>
            <Link href="/signup" className={styles.btnPrimary}>Start a Collection</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
