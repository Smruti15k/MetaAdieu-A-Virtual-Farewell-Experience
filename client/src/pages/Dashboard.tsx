import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Event {
    id: string;
    title: string;
    eventDate: string;
    guestOfHonor: string;
    theme: string;
}

import { API_base_URL } from '../config';

const Dashboard = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ name: string } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for Firebase auth to initialize before making API calls
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                // No Firebase user — check localStorage for legacy/guest sessions
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                // Try with the stored token (may be stale)
                const userData = localStorage.getItem('user');
                if (userData) setUser(JSON.parse(userData));
                await fetchEvents(token);
            } else {
                // Firebase user is signed in — get a fresh token
                try {
                    const freshToken = await firebaseUser.getIdToken(true);
                    // Update localStorage with fresh token
                    localStorage.setItem('token', freshToken);

                    const userData = localStorage.getItem('user');
                    if (userData) {
                        setUser(JSON.parse(userData));
                    } else {
                        setUser({ name: firebaseUser.displayName || 'Host' });
                    }

                    await fetchEvents(freshToken);
                } catch (err) {
                    console.error("Failed to get fresh token:", err);
                    navigate('/login');
                }
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchEvents = async (token: string) => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            const res = await axios.get(`${API_base_URL}/api/events/my-events`, config);
            if (res.data.success) {
                setEvents(res.data.events);
            }
        } catch (err) {
            console.error("Failed to fetch events", err);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = (id: string) => {
        const link = `${window.location.origin}/event/${id}`;
        navigator.clipboard.writeText(link);
        alert('Invitation link copied to clipboard!');
    };

    if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Welcome, {user?.name || 'Host'}</h1>
                <div className={styles.actions}>
                    <Link to="/create-event" className={styles.createBtn}>+ Create New Event</Link>
                    <button onClick={() => {
                        localStorage.clear();
                        auth.signOut();
                        navigate('/');
                    }} className={styles.logoutBtn}>Logout</button>
                </div>
            </header>

            <main className={styles.grid}>
                {events.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>You haven't hosted any farewell events yet.</p>
                        <Link to="/create-event" className={styles.ctaLink}>Get Started</Link>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>{event.title}</h3>
                                <span className={styles.badge}>{new Date(event.eventDate).toLocaleDateString()}</span>
                            </div>
                            <p>Guest of Honor: <strong>{event.guestOfHonor}</strong></p>
                            <div className={styles.cardActions}>
                                <Link to={`/event/${event.id}`} className={styles.viewBtn}>Enter Event Room</Link>
                                <button onClick={() => copyLink(event.id)} className={styles.shareBtn}>Copy Invite Link</button>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default Dashboard;

