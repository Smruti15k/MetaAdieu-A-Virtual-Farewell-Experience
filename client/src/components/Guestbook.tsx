import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Guestbook.module.css';

interface GuestbookEntry {
    id: number;
    name: string;
    message: string;
    createdAt: string;
}

interface GuestbookProps {
    eventId: string;
}

import { API_base_URL } from '../config';

const Guestbook = ({ eventId }: GuestbookProps) => {
    const [entries, setEntries] = useState<GuestbookEntry[]>([]);
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch entries
    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const res = await axios.get(`${API_base_URL}/api/guestbook/event/${eventId}`);
                if (res.data.success) {
                    setEntries(res.data.entries);
                }
            } catch (err) {
                console.error('Failed to load guestbook', err);
            }
        };
        fetchEntries();
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !message.trim()) {
            setError('Please fill in both name and message.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post(`${API_base_URL}/api/guestbook`, {
                eventId,
                name,
                message
            });

            if (res.data.success) {
                setEntries([res.data.entry, ...entries]);
                setMessage('');
                // Keep name if they want to post again? Or clear it. Let's clear it.
                // setName(''); 
                // Actually, maybe keep name for convenience.
            }
        } catch (err) {
            console.error('Failed to sign guestbook', err);
            setError('Failed to sign. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Sign the Guestbook</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && <p style={{ color: '#B3CFE5', background: 'rgba(10, 25, 49, 0.5)', padding: '0.5rem', borderRadius: '4px' }}>{error}</p>}

                <div className={styles.inputGroup}>
                    <label>Your Name</label>
                    <input
                        type="text"
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        maxLength={50}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label>Message</label>
                    <textarea
                        className={styles.textarea}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Leave a heartfelt message..."
                        rows={4}
                        maxLength={500}
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Signing...' : 'Sign Guestbook'}
                </button>
            </form>

            <div className={styles.entriesList}>
                {entries.length === 0 ? (
                    <p className={styles.empty}>Be the first to sign the guestbook!</p>
                ) : (
                    entries.map(entry => (
                        <div key={entry.id} className={styles.entryCard}>
                            <div className={styles.entryHeader}>
                                <span className={styles.name}>{entry.name}</span>
                                <span className={styles.date}>{new Date(entry.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className={styles.message}>{entry.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Guestbook;
