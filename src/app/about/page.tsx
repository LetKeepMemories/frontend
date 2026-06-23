import Link from 'next/link';
import styles from '@/styles/staticPage.module.css';

export const metadata = {
  title: 'About — Lets Keep Memories',
};

export default function About() {
  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <h1>Why we built Lets Keep Memories</h1>
          <p>
            Lets Keep Memories started from a simple idea: the messages people leave for each other on
            birthdays, anniversaries, and in memory of a loved one deserve a home that lasts longer
            than a group chat.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.prose}>
            <h2>What we&apos;re building</h2>
            <p>
              We make it easy to create a beautiful, shareable page for any occasion — a birthday, a
              wedding, a memorial — and collect photos, videos, and written wishes from everyone who
              wants to take part, no app or account required for guests.
            </p>
            <h2>Where we are today</h2>
            <p>
              Lets Keep Memories is early. We&apos;re a small team shipping features quickly and listening
              closely to the people using it. If something feels rough around the edges, that&apos;s
              because it probably is — and we&apos;d love to hear about it.
            </p>
          </div>
          <div className={styles.ctaRow}>
            <Link href="/signup" className={styles.btnPrimary}>Start a Collection</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
