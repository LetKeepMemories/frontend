import styles from '@/styles/staticPage.module.css';

export const metadata = {
  title: 'Terms of Service — Lets Keep Memories',
};

export default function Terms() {
  return (
    <main>
      <section className={styles.hero}>
        <div className="container">
          <h1>Terms of Service</h1>
        </div>
      </section>

      <section className={styles.section}>
        <div className="container">
          <div className={styles.prose}>
            <div className={styles.note}>
              Lets Keep Memories is an early-stage product and this page is a placeholder while our full
              terms are finalized. Questions? Email{' '}
              <a href="mailto:hello@letskeepmemory.com" className={styles.contactLink}>hello@letskeepmemory.com</a>.
            </div>

            <h2>Using Lets Keep Memories</h2>
            <p>
              You&apos;re responsible for the content you post — both as an occasion owner and as a
              guest leaving a message. Don&apos;t post anything illegal, abusive, or that you don&apos;t
              have the right to share.
            </p>

            <h2>Your content</h2>
            <p>
              You keep ownership of what you upload. By posting it, you give us permission to store and
              display it as part of the occasion it was submitted to.
            </p>

            <h2>Moderation</h2>
            <p>
              Occasion owners can remove messages left on their own occasion. We may remove content or
              suspend accounts that violate these terms.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
