'use client';

import styles from './page.module.css';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import GalleryCarousel from '@/components/ui/GalleryCarousel';

interface EventType {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface OccasionLocation {
  city?: string;
  state?: string;
  country?: string;
}

interface OccasionMetadata {
  middle_name?: string;
  gender?: string;
  relationship?: string;
  designation?: string;
  birth_location?: OccasionLocation;
  death_location?: OccasionLocation;
  partner_2_first_name?: string;
  partner_2_last_name?: string;
  anniversary_milestone?: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

interface PublicOccasion {
  id: string;
  title: string;
  person_first_name: string;
  person_last_name: string;
  person_full_name: string;
  description: string;
  bio: string;
  profile_image: string;
  age: number | null;
  event_type: EventType;
  birth_date: string | null;
  death_date: string | null;
  event_date: string | null;
  gallery_images: GalleryImage[];
  metadata: OccasionMetadata;
}

interface PublicMessage {
  id: string;
  sender_full_name: string;
  relationship: string;
  message: string;
  created_at: string;
}

interface GuestMessagePayload {
  sender_first_name: string;
  sender_last_name: string;
  relationship: string;
  message: string;
  media: [];
}

type OccasionMood = 'memorial' | 'birthday' | 'anniversary' | 'generic';

interface MoodCopy {
  formTitle: string;
  relationshipLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  successMessage: string;
  messagesSectionTitle: string;
  emptyState: string;
  aboutTitle: string;
}

function getMoodCopy(mood: OccasionMood, firstName: string): MoodCopy {
  switch (mood) {
    case 'memorial':
      return {
        formTitle: 'Share a Memory',
        relationshipLabel: `Your relationship to ${firstName}`,
        messageLabel: 'Your memory or message',
        messagePlaceholder: 'Share a favorite memory, a story, or a few words of comfort for the family...',
        submitLabel: 'Share This Memory',
        submittingLabel: 'Sharing...',
        successMessage: 'Thank you for sharing this memory.',
        messagesSectionTitle: 'Memories Shared',
        emptyState: 'Be the first to share a memory.',
        aboutTitle: `Remembering ${firstName}`,
      };
    case 'birthday':
      return {
        formTitle: 'Send Your Birthday Wishes',
        relationshipLabel: `Your relationship to ${firstName}`,
        messageLabel: 'Your birthday message',
        messagePlaceholder: 'Write something fun to help celebrate their day...',
        submitLabel: 'Send Wishes',
        submittingLabel: 'Sending...',
        successMessage: 'Your wishes have been sent!',
        messagesSectionTitle: 'Birthday Wishes',
        emptyState: 'Be the first to send a birthday wish!',
        aboutTitle: `About ${firstName}`,
      };
    case 'anniversary':
      return {
        formTitle: 'Celebrate Their Love',
        relationshipLabel: 'Your relationship to the couple',
        messageLabel: 'Your message',
        messagePlaceholder: 'Share your congratulations and well wishes for their anniversary...',
        submitLabel: 'Send Congratulations',
        submittingLabel: 'Sending...',
        successMessage: 'Your congratulations have been sent!',
        messagesSectionTitle: 'Messages of Love',
        emptyState: 'Be the first to send your congratulations!',
        aboutTitle: 'Our Story',
      };
    default:
      return {
        formTitle: 'Leave a Message',
        relationshipLabel: `Relationship to ${firstName}`,
        messageLabel: 'Your message',
        messagePlaceholder: 'Write your message here...',
        submitLabel: 'Post Message',
        submittingLabel: 'Submitting...',
        successMessage: 'Your message was successfully posted!',
        messagesSectionTitle: 'Messages from Loved Ones',
        emptyState: 'Be the first to leave a message!',
        aboutTitle: `About ${firstName}`,
      };
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  return new Date(dateStr).toLocaleDateString(undefined, options);
}

function formatLocation(loc: OccasionLocation | undefined) {
  if (!loc) return null;
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  return parts.join(', ');
}

export default function GuestWishView() {
  const params = useParams();
  const slug = params.slug as string;

  const [senderFirstName, setSenderFirstName] = useState('');
  const [senderLastName, setSenderLastName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: occasion, isLoading } = useQuery<PublicOccasion>({
    queryKey: ['publicOccasion', slug],
    queryFn: async () => {
      const response = await api.get(`/public/occasions/${slug}/`);
      return response.data;
    },
  });

  const { data: messages, refetch } = useQuery<PublicMessage[]>({
    queryKey: ['publicMessages', slug],
    queryFn: async () => {
      const response = await api.get(`/public/occasions/${slug}/messages/`);
      return response.data.results;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: GuestMessagePayload) => {
      const response = await api.post(`/public/occasions/${slug}/messages/submit/`, data);
      return response.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setSenderFirstName('');
      setSenderLastName('');
      setRelationship('');
      setMessage('');
      refetch();
      setTimeout(() => setSuccess(false), 5000);
    },
    onError: (err: unknown) => {
      setError(getErrorMessage(err, 'Failed to submit message.'));
    }
  });

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    submitMutation.mutate({
      sender_first_name: senderFirstName,
      sender_last_name: senderLastName,
      relationship,
      message,
      media: []
    });
  };

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (!occasion) return <div className={styles.errorContainer}>Occasion not found.</div>;

  const eventTypeSlug = occasion.event_type?.slug;
  const isMemorial = eventTypeSlug === 'memorial';
  const isBirthday = eventTypeSlug === 'birthday';
  const isAnniversary = eventTypeSlug === 'anniversary';
  const mood: OccasionMood = isMemorial ? 'memorial' : isBirthday ? 'birthday' : isAnniversary ? 'anniversary' : 'generic';

  const themeClass = {
    memorial: styles.themeMemorial,
    birthday: styles.themeBirthday,
    anniversary: styles.themeAnniversary,
    generic: styles.themeGeneric,
  }[mood];

  const copy = getMoodCopy(mood, occasion.person_first_name);

  const fullName = [
    occasion.person_first_name,
    occasion.metadata?.middle_name,
    occasion.person_last_name
  ].filter(Boolean).join(' ');

  const partner2FullName = occasion.metadata?.partner_2_first_name
    ? [occasion.metadata.partner_2_first_name, occasion.metadata.partner_2_last_name || occasion.person_last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  const coupleNames = partner2FullName ? `${fullName} & ${partner2FullName}` : fullName;

  const birthLoc = formatLocation(occasion.metadata?.birth_location);
  const deathLoc = formatLocation(occasion.metadata?.death_location);

  return (
    <div className={`${styles.container} ${themeClass}`}>
      <header className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          {occasion.profile_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={occasion.profile_image} alt={fullName} className={styles.profileImage} />
          )}

          {isMemorial ? (
            <>
              <h2 className={styles.subtitle}>In Loving Memory Of</h2>
              <h1 className={styles.title}>{fullName}</h1>
              {occasion.metadata?.designation && (
                <p className={styles.designation}>{occasion.metadata.designation}</p>
              )}

              {(occasion.birth_date || occasion.death_date || occasion.age != null) && (
                <div className={styles.datesRow}>
                  {occasion.birth_date && (
                    <div className={styles.dateBlock}>
                      <span className={styles.dateLabel}>Born</span>
                      <span className={styles.dateValue}>{formatDate(occasion.birth_date)}</span>
                      {birthLoc && <span className={styles.locationValue}>{birthLoc}</span>}
                    </div>
                  )}
                  {occasion.death_date && (
                    <div className={styles.dateBlock}>
                      <span className={styles.dateLabel}>Passed Away</span>
                      <span className={styles.dateValue}>{formatDate(occasion.death_date)}</span>
                      {deathLoc && <span className={styles.locationValue}>{deathLoc}</span>}
                    </div>
                  )}
                  {occasion.age != null && (
                    <div className={styles.dateBlock}>
                      <span className={styles.dateLabel}>Age</span>
                      <span className={styles.dateValue}>{occasion.age}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : isBirthday ? (
            <>
              <h2 className={styles.subtitle}>Happy Birthday</h2>
              <h1 className={styles.title}>{fullName}</h1>
              {(occasion.birth_date || occasion.age != null) && (
                <div className={styles.datesRow} style={{ marginTop: '1rem' }}>
                  {occasion.birth_date && (
                    <div className={styles.dateBlock}>
                      <span className={styles.dateLabel}>Born</span>
                      <span className={styles.dateValue}>{formatDate(occasion.birth_date)}</span>
                    </div>
                  )}
                  {occasion.age != null && (
                    <div className={styles.dateBlock}>
                      <span className={styles.dateLabel}>Turning</span>
                      <span className={styles.dateValue}>{occasion.age}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : isAnniversary ? (
            <>
              <h2 className={styles.subtitle}>
                Happy {occasion.metadata?.anniversary_milestone ? `${occasion.metadata.anniversary_milestone} ` : ''}Anniversary
              </h2>
              <h1 className={styles.title}>{coupleNames}</h1>
              {occasion.event_date && (
                <div className={styles.dateBlock} style={{ marginTop: '1rem' }}>
                  <span className={styles.dateLabel}>Celebrated On</span>
                  <span className={styles.dateValue}>{formatDate(occasion.event_date)}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className={styles.title}>Celebrating {fullName}</h1>
              <p className={styles.subtitle}>{occasion.title}</p>
            </>
          )}

          {occasion.description && (
            <p className={styles.description}>{occasion.description}</p>
          )}
        </div>
      </header>

      {(occasion.bio || occasion.gallery_images?.length > 0) && (
        <section className={`container ${styles.aboutSection}`}>
          {occasion.bio && (
            <div className={styles.aboutText}>
              <h2 className={styles.sectionTitle}>{copy.aboutTitle}</h2>
              <p className={styles.bioText}>{occasion.bio}</p>
            </div>
          )}
          {occasion.gallery_images?.length > 0 && (
            <div className={styles.gallerySide}>
              <GalleryCarousel images={occasion.gallery_images} />
            </div>
          )}
        </section>
      )}

      <main className={`container ${styles.main}`}>
        <div className={styles.grid}>

          <div className={styles.messagesColumn}>
            <h2 className={styles.sectionTitle}>{copy.messagesSectionTitle}</h2>
            {messages?.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{copy.emptyState}</p>
              </div>
            ) : (
              <div className={styles.messageList}>
                {messages?.map((msg) => (
                  <div key={msg.id} className={styles.messageCard}>
                    <p className={styles.messageText}>&ldquo;{msg.message}&rdquo;</p>
                    <div className={styles.messageAuthor}>
                      <strong>{msg.sender_full_name}</strong>
                      {msg.relationship && <span className={styles.relationship}> • {msg.relationship}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formColumn}>
            <div className={styles.formCard}>
              <h2 className={styles.sectionTitle} style={{ margin: '0 0 1.5rem 0' }}>{copy.formTitle}</h2>

              {success && <div className={styles.success}>{copy.successMessage}</div>}
              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.nameRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="senderFirstName">First Name</label>
                    <input
                      id="senderFirstName"
                      type="text"
                      required
                      value={senderFirstName}
                      onChange={e => setSenderFirstName(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="senderLastName">Last Name</label>
                    <input
                      id="senderLastName"
                      type="text"
                      value={senderLastName}
                      onChange={e => setSenderLastName(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="relationship">{copy.relationshipLabel}</label>
                  <input
                    id="relationship"
                    type="text"
                    placeholder="e.g. Friend, Sister, Colleague"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="message">{copy.messageLabel}</label>
                  <textarea
                    id="message"
                    rows={5}
                    required
                    placeholder={copy.messagePlaceholder}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className={styles.input}
                  />
                </div>

                <button type="submit" className={styles.btnPrimary} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? copy.submittingLabel : copy.submitLabel}
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
