import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css';

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
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (userData) {
            setUser(JSON.parse(userData));
        }

        const fetchEvents = async () => {
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

        fetchEvents();
    }, [navigate]);

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
