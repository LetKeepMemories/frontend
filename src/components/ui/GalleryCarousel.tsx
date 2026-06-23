'use client';

import { useState } from 'react';
import styles from './GalleryCarousel.module.css';

interface GalleryImage {
  id: string;
  image_url: string;
}

export default function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const goPrev = () => setIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className={styles.carousel}>
      <div className={styles.slideWindow}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[index].image_url} alt={`Gallery photo ${index + 1}`} className={styles.slideImage} />
        {images.length > 1 && (
          <>
            <button type="button" onClick={goPrev} className={`${styles.navBtn} ${styles.navBtnPrev}`} aria-label="Previous photo">
              &#8249;
            </button>
            <button type="button" onClick={goNext} className={`${styles.navBtn} ${styles.navBtnNext}`} aria-label="Next photo">
              &#8250;
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className={styles.dots}>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
