'use client';

import styles from './page.module.css';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface EventType {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface OccasionLocation {
  city: string;
  state: string;
  country: string;
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

interface CreateOccasionPayload {
  title: string;
  event_type: string;
  person_first_name: string;
  person_last_name: string;
  status: string;
  metadata: OccasionMetadata;
  slug?: string;
  bio?: string;
  description?: string;
  birth_date?: string;
  death_date?: string;
  event_date?: string;
}

function CreateOccasionContent() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');

  // Basic Info
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState(typeParam || '');
  // Keep eventType synced with the ?type= query param across client-side
  // navigations (e.g. dashboard quick links) without setState in an Effect.
  const [lastTypeParam, setLastTypeParam] = useState(typeParam);
  if (typeParam !== lastTypeParam) {
    setLastTypeParam(typeParam);
    setEventType(typeParam || '');
  }
  const [status, setStatus] = useState('published');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  
  // Names
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Details (Memorial specific)
  const [gender, setGender] = useState('Male');
  const [relationship, setRelationship] = useState('');
  const [designation, setDesignation] = useState('');

  // Anniversary specific
  const [anniversaryMilestone, setAnniversaryMilestone] = useState('');

  // Dates & Locations
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthCity, setBirthCity] = useState('');
  const [birthState, setBirthState] = useState('');
  const [birthCountry, setBirthCountry] = useState('');

  const [deathYear, setDeathYear] = useState('');
  const [deathMonth, setDeathMonth] = useState('');
  const [deathDay, setDeathDay] = useState('');
  const [deathCity, setDeathCity] = useState('');
  const [deathState, setDeathState] = useState('');
  const [deathCountry, setDeathCountry] = useState('');

  // Text fields
  const [bio, setBio] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [galleryUploadStatus, setGalleryUploadStatus] = useState('');

  // Gallery photos
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const galleryPreviews = useMemo(() => galleryFiles.map((file) => URL.createObjectURL(file)), [galleryFiles]);
  useEffect(() => {
    return () => {
      galleryPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [galleryPreviews]);

  // Auto-generate slug
  useEffect(() => {
    if (!isSlugManuallyEdited && (title || firstName || lastName)) {
      const parts = [];
      if (title) {
        parts.push(title);
      } else {
        if (eventType) parts.push(eventType);
        if (firstName) parts.push(firstName);
        if (lastName) parts.push(lastName);
      }
      const generated = parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
      setSlug(generated);
    }
  }, [title, eventType, firstName, lastName, isSlugManuallyEdited]);

  const { data: eventTypes } = useQuery<EventType[]>({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const response = await api.get('/event-types/');
      return response.data;
    },
  });

  const { data: galleryLimitData } = useQuery<{ max_gallery_images: number }>({
    queryKey: ['galleryLimit'],
    queryFn: async () => {
      const response = await api.get('/gallery-limit/');
      return response.data;
    },
  });
  const maxGalleryImages = galleryLimitData?.max_gallery_images ?? 5;

  const handleGalleryFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setGalleryFiles((prev) => [...prev, ...selected].slice(0, maxGalleryImages));
    e.target.value = '';
  };

  const handleRemoveGalleryFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isAuthenticated) return null;

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const metadata: OccasionMetadata = {};
      
      let finalBirthDate = null;
      let finalDeathDate = null;

      if (eventType === 'memorial') {
        metadata.middle_name = middleName;
        metadata.gender = gender;
        metadata.relationship = relationship;
        metadata.designation = designation;
        
        metadata.birth_location = { city: birthCity, state: birthState, country: birthCountry };
        metadata.death_location = { city: deathCity, state: deathState, country: deathCountry };

        if (birthYear && birthMonth && birthDay) {
          finalBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
        }
        if (deathYear && deathMonth && deathDay) {
          finalDeathDate = `${deathYear}-${deathMonth.padStart(2, '0')}-${deathDay.padStart(2, '0')}`;
        }
      } else if (eventType === 'birthday') {
        if (birthYear && birthMonth && birthDay) {
          finalBirthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
        }
      } else if (eventType === 'anniversary') {
        metadata.anniversary_milestone = anniversaryMilestone;
      }

      const payload: CreateOccasionPayload = {
        title,
        event_type: eventType,
        person_first_name: firstName,
        person_last_name: lastName,
        status,
        metadata,
      };

      if (slug.trim()) payload.slug = slug.trim();
      if (bio.trim()) payload.bio = bio.trim();
      if (description.trim()) payload.description = description.trim();
      if (finalBirthDate) payload.birth_date = finalBirthDate;
      if (finalDeathDate) payload.death_date = finalDeathDate;
      if (eventDate) payload.event_date = eventDate;

      const response = await api.post('/occasions/', payload);
      const occasionId = response.data.id;

      for (let i = 0; i < galleryFiles.length; i++) {
        setGalleryUploadStatus(`Uploading photo ${i + 1} of ${galleryFiles.length}...`);
        try {
          const imageUrl = await uploadToCloudinary(galleryFiles[i]);
          await api.post(`/occasions/${occasionId}/gallery/`, { image_url: imageUrl });
        } catch {
          // The occasion itself was created successfully — don't block
          // creation on a single photo failing to upload.
        }
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to create occasion.'));
    } finally {
      setIsSubmitting(false);
      setGalleryUploadStatus('');
    }
  };

  // Helper arrays for date dropdowns
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 150 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={styles.container}>
      <main className={`container ${styles.main}`}>
        <div className={`${styles.formCard} glass`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Link href="/dashboard" className={styles.backBtn}>&larr; Back</Link>
            <h2 style={{ margin: 0 }}>Create New Occasion</h2>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* OCCASION TYPE AND TITLE */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
              {!typeParam && (
                <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="eventType">Occasion Type</label>
                  <select id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} required className={styles.input}>
                    <option value="">Select a type...</option>
                    {eventTypes?.map((et) => (
                      <option key={et.id} value={et.slug}>{et.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="title">Title of the Occasion</label>
                <input id="title" type="text" placeholder="e.g. John's 50th Birthday Celebration" value={title} onChange={(e) => setTitle(e.target.value)} required className={styles.input} />
              </div>

              <div className={styles.nameRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="slug">Custom URL (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)', color: 'var(--text-muted)' }}>/</span>
                    <input id="slug" type="text" placeholder="e.g. john-50th" value={slug} onChange={(e) => { setSlug(e.target.value); setIsSlugManuallyEdited(true); }} className={styles.input} style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="status">Status</label>
                  <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} required className={styles.input}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* DYNAMIC FORM SECTION */}
            {eventType === 'memorial' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>This memorial is dedicated to:</h3>
                  
                  <div className={styles.nameRow} style={{ marginBottom: '1rem' }}>
                    <div className={styles.inputGroup}>
                      <label>First name</label>
                      <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Middle name</label>
                      <input type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={styles.input} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Last name</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className={styles.input} />
                    </div>
                  </div>

                  <div className={styles.nameRow} style={{ marginBottom: '1rem' }}>
                    <div className={styles.inputGroup}>
                      <label>Gender</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                          <input type="radio" name="gender" value="Male" checked={gender === 'Male'} onChange={(e) => setGender(e.target.value)} /> Male
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                          <input type="radio" name="gender" value="Female" checked={gender === 'Female'} onChange={(e) => setGender(e.target.value)} /> Female
                        </label>
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Relationship to Honoree (Optional)</label>
                      <input 
                        type="text" 
                        list="relationship-options"
                        placeholder="Search or type e.g. Friend, Sister"
                        value={relationship} 
                        onChange={(e) => setRelationship(e.target.value)} 
                        className={styles.input} 
                      />
                      <datalist id="relationship-options">
                        <option value="Friend" />
                        <option value="Best Friend" />
                        <option value="Mother" />
                        <option value="Father" />
                        <option value="Sister" />
                        <option value="Brother" />
                        <option value="Daughter" />
                        <option value="Son" />
                        <option value="Grandmother" />
                        <option value="Grandfather" />
                        <option value="Aunt" />
                        <option value="Uncle" />
                        <option value="Cousin" />
                        <option value="Niece" />
                        <option value="Nephew" />
                        <option value="Colleague" />
                        <option value="Boss" />
                        <option value="Mentor" />
                        <option value="Student" />
                        <option value="Neighbor" />
                        <option value="Partner" />
                        <option value="Spouse" />
                        <option value="Acquaintance" />
                      </datalist>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Designation</label>
                      <input type="text" placeholder="Special designation, if applies" value={designation} onChange={(e) => setDesignation(e.target.value)} className={styles.input} />
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Dates and Locations</h3>
                  
                  {/* BORN */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Born</h4>
                    <div className={styles.nameRow} style={{ marginBottom: '1rem' }}>
                      <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={styles.input}><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={styles.input}><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={styles.input}><option value="">Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
                    </div>
                    <div className={styles.nameRow}>
                      <input type="text" placeholder="City or town" value={birthCity} onChange={(e) => setBirthCity(e.target.value)} className={styles.input} />
                      <input type="text" placeholder="State or area" value={birthState} onChange={(e) => setBirthState(e.target.value)} className={styles.input} />
                      <input type="text" list="country-options" placeholder="Country" value={birthCountry} onChange={(e) => setBirthCountry(e.target.value)} className={styles.input} />
                    </div>
                  </div>

                  {/* PASSED AWAY */}
                  <div>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Passed away</h4>
                    <div className={styles.nameRow} style={{ marginBottom: '1rem' }}>
                      <select value={deathYear} onChange={(e) => setDeathYear(e.target.value)} className={styles.input}><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                      <select value={deathMonth} onChange={(e) => setDeathMonth(e.target.value)} className={styles.input}><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
                      <select value={deathDay} onChange={(e) => setDeathDay(e.target.value)} className={styles.input}><option value="">Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
                    </div>
                    <div className={styles.nameRow}>
                      <input type="text" placeholder="City or town" value={deathCity} onChange={(e) => setDeathCity(e.target.value)} className={styles.input} />
                      <input type="text" placeholder="State or area" value={deathState} onChange={(e) => setDeathState(e.target.value)} className={styles.input} />
                      <input type="text" list="country-options" placeholder="Country" value={deathCountry} onChange={(e) => setDeathCountry(e.target.value)} className={styles.input} />
                    </div>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="bio">Biography / Welcome Message</label>
                  <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Welcome guests and tell them what this collection is for..." className={styles.input} />
                </div>

              </div>
            ) : eventType === 'birthday' ? (
              <>
                <div className={styles.nameRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="firstName">Honoree&apos;s First Name</label>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={styles.input} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="lastName">Honoree&apos;s Last Name</label>
                    <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={styles.input} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Date of Birth</label>
                  <div className={styles.nameRow}>
                    <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} className={styles.input}><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                    <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={styles.input}><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
                    <select value={birthDay} onChange={(e) => setBirthDay(e.target.value)} className={styles.input}><option value="">Day</option>{days.map(d => <option key={d} value={d}>{d}</option>)}</select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="bio">Biography / Bio</label>
                  <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell a little bit about the birthday person..." className={styles.input} />
                </div>
              </>
            ) : eventType === 'anniversary' ? (
              <>
                <div className={styles.nameRow} style={{ marginBottom: '1.5rem' }}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="firstName">Honoree&apos;s First Name</label>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={styles.input} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="lastName">Honoree&apos;s Last Name</label>
                    <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={styles.input} />
                  </div>
                </div>

                <div className={styles.nameRow} style={{ marginBottom: '1.5rem' }}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="eventDate">Date of Anniversary</label>
                    <input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={styles.input} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="milestone">Milestone (Optional)</label>
                    <input id="milestone" type="text" placeholder="e.g. 1st, 10th, 25th" value={anniversaryMilestone} onChange={(e) => setAnniversaryMilestone(e.target.value)} className={styles.input} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="bio">Our Story / Welcome Message</label>
                  <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Welcome guests and share a brief story about the honoree..." className={styles.input} />
                </div>
              </>
            ) : (
              // GENERIC FALLBACK
              <>
                <div className={styles.nameRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="firstName">Honoree/Subject First Name</label>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className={styles.input} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="lastName">Last Name</label>
                    <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={styles.input} />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="eventDate">Date of Event</label>
                  <input id="eventDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={styles.input} />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="description">Description or Welcome Message</label>
                  <textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Welcome guests and tell them what this collection is for..." className={styles.input} />
                </div>
              </>
            )}

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                Gallery Photos
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Add up to {maxGalleryImages} photos to showcase this occasion ({galleryFiles.length}/{maxGalleryImages} selected).
              </p>

              {galleryPreviews.length > 0 && (
                <div className={styles.galleryGrid}>
                  {galleryPreviews.map((src, index) => (
                    <div key={src} className={styles.galleryThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Gallery photo ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryFile(index)}
                        className={styles.galleryRemoveBtn}
                        aria-label="Remove photo"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {galleryFiles.length < maxGalleryImages && (
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesSelected}
                  className={styles.input}
                />
              )}
            </div>

            {galleryUploadStatus && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{galleryUploadStatus}</div>
            )}

            <button type="submit" className={styles.btnPrimary} disabled={isSubmitting} style={{ marginTop: '2rem' }}>
              {isSubmitting ? (galleryUploadStatus || 'Creating...') : 'Create Occasion'}
            </button>
          </form>
        </div>
      </main>

      {/* Reusable datalist for countries */}
      <datalist id="country-options">
        <option value="United States" />
        <option value="Canada" />
        <option value="United Kingdom" />
        <option value="Australia" />
        <option value="New Zealand" />
        <option value="Ireland" />
        <option value="India" />
        <option value="South Africa" />
        <option value="Germany" />
        <option value="France" />
        <option value="Italy" />
        <option value="Spain" />
        <option value="Mexico" />
        <option value="Brazil" />
        <option value="Japan" />
        <option value="China" />
        <option value="South Korea" />
        <option value="Netherlands" />
        <option value="Sweden" />
        <option value="Norway" />
        <option value="Denmark" />
        <option value="Finland" />
        <option value="Switzerland" />
        <option value="Singapore" />
        <option value="United Arab Emirates" />
        <option value="Nigeria" />
        <option value="Kenya" />
        <option value="Ghana" />
      </datalist>
    </div>
  );
}

export default function CreateOccasion() {
  return (
    <Suspense fallback={<div className={styles.container}><main className={`container ${styles.main}`}><div className={styles.loading}>Loading...</div></main></div>}>
      <CreateOccasionContent />
    </Suspense>
  );
}
