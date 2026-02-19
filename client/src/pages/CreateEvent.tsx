import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './CreateEvent.module.css';

import { API_base_URL } from '../config';

const CreateEvent = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [guestOfHonor, setGuestOfHonor] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [duration, setDuration] = useState(60);
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            const payload = {
                title,
                guestOfHonor,
                eventDate,
                duration,
                description,
                isPrivate
            };
            const response = await axios.post(`${API_base_URL}/api/events`, payload, config);

            if (response.data.success) {
                // Determine user intent or default direct
                alert('Event Created Successfully! ID: ' + response.data.event.id);
                navigate('/');
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.details ? `${err.response.data.error}: ${err.response.data.details}` : (err.response?.data?.error || 'Failed to create event');
            setError(msg);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* Left Side: Form */}
                <div className={styles.formSection}>
                    <div onClick={() => navigate('/')} className={styles.backLink}>
                        ← Back to Home
                    </div>

                    <div className={styles.formBox}>
                        <h2>Create Event</h2>
                        <p className={styles.subtitle}>Set the stage for a memorable farewell.</p>

                        {error && <p className={styles.error}>{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>Event Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Farewell for Sarah"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Guest of Honor</label>
                                <input
                                    type="text"
                                    value={guestOfHonor}
                                    onChange={(e) => setGuestOfHonor(e.target.value)}
                                    required
                                    placeholder="Name of person leaving"
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Duration (mins)</label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        min="15"
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Brief description of the event..."
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Privacy</label>
                                <select value={String(isPrivate)} onChange={(e) => setIsPrivate(e.target.value === 'true')}>
                                    <option value="true">Private (Link Only)</option>
                                    <option value="false">Public</option>
                                </select>
                            </div>

                            <button type="submit" className={styles.submitBtn}>Create Event</button>
                        </form>
                    </div>
                </div>

                {/* Right Side: Spline 3D */}
                <div className={styles.splineSection}>
                    <iframe
                        src='https://my.spline.design/retroradiostage-AfufVOGd9n5fV46j3uqy6af3/'
                        frameBorder='0'
                        width='100%'
                        height='100%'
                        className={styles.splineContainer}
                        title="3D Background"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
