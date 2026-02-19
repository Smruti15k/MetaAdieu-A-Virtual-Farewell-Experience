import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Dashboard.module.css';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useToast } from '../components/Toast';
import Footer from '../components/Footer';
import { DashboardSkeleton } from '../components/SkeletonLoader';

interface Event {
    id: string;
    title: string;
    eventDate: string;
    guestOfHonor: string;
    theme: string;
}

interface User {
    name: string;
    photo?: string;
}

import { API_base_URL } from '../config';

const Dashboard = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        // Wait for Firebase auth to initialize before making API calls
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                // Check localStorage for legacy/guest sessions or redirect
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const savedUser = localStorage.getItem('user');
                if (savedUser) setUser(JSON.parse(savedUser));
                await fetchEvents(token);
            } else {
                // Firebase user is signed in
                try {
                    const freshToken = await firebaseUser.getIdToken(true);
                    localStorage.setItem('token', freshToken);
                    setUser({
                        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Host',
                        photo: firebaseUser.photoURL || undefined
                    });
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
            showToast('Failed to load your events', 'error');
        } finally {
            // Add a small artificial delay to show off the skeleton if it loads too fast
            setTimeout(() => setLoading(false), 600);
        }
    };

    const copyLink = (id: string) => {
        const link = `${window.location.origin}/event/${id}`;
        navigator.clipboard.writeText(link);
        showToast('Invite link copied to clipboard!', 'success');
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const token = localStorage.getItem('token');
            // Assuming DELETE endpoint exists or will exist soon
            // await axios.delete(`${API_base_URL}/api/events/${deleteId}`, { headers: { Authorization: `Bearer ${token}` } });

            // Optimistically update UI since backend implementation might be pending
            setEvents(prev => prev.filter(ev => ev.id !== deleteId));
            showToast('Event deleted successfully', 'success');
            setDeleteId(null);
        } catch (err) {
            showToast('Failed to delete event', 'error');
        }
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.userInfo}>
                        <img
                            src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=4A7FA7&color=fff`}
                            alt="Profile"
                            className={styles.avatar}
                        />
                        <div className={styles.welcomeText}>
                            <h1>Welcome back, Let's create Magic!</h1>
                            <span>{user?.name || 'Host'}</span>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Link to="/create-event" className={styles.createBtn}>
                            <span style={{ fontSize: '1.2rem' }}>+</span> Create Event
                        </Link>
                        <button onClick={() => {
                            localStorage.clear();
                            auth.signOut();
                            navigate('/login');
                            showToast('Logged out successfully', 'info');
                        }} className={styles.logoutBtn}>Logout</button>
                    </div>
                </header>

                <main className={styles.grid}>
                    {events.length === 0 ? (
                        <div className={styles.emptyState}>
                            <h2>No Events Yet</h2>
                            <p>Host your first virtual farewell and make it memorable.</p>
                            <Link to="/create-event" className={styles.ctaLink}>Create New Event</Link>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3>{event.title}</h3>
                                    <span className={styles.badge}>
                                        {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                <div className={styles.cardBody}>
                                    <p>Guest of Honor</p>
                                    <strong>{event.guestOfHonor}</strong>
                                </div>

                                <div className={styles.cardFooter}>
                                    <Link to={`/event/${event.id}`} className={styles.viewBtn}>
                                        Enter Room
                                    </Link>
                                    <button
                                        onClick={() => copyLink(event.id)}
                                        className={styles.shareBtn}
                                        title="Copy Invite Link"
                                    >
                                        Share
                                        {/* <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> */}
                                    </button>
                                    <button
                                        onClick={(e) => confirmDelete(e, event.id)}
                                        className={styles.deleteBtn}
                                        title="Delete Event"
                                    >
                                        Del
                                        {/* <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> */}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </main>

                {/* Delete Confirmation Modal */}
                {deleteId && (
                    <div className={styles.modalOverlay} onClick={() => setDeleteId(null)}>
                        <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
                            <h3>Delete Event?</h3>
                            <p>This action cannot be undone. All memories and messages will be lost.</p>
                            <div className={styles.modalActions}>
                                <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                                <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Delete Forever</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default Dashboard;
