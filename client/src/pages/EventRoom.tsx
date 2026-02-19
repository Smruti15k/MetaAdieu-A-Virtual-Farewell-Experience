import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import styles from './EventRoom.module.css';
import MemoryWall from '../components/MemoryWall';
import Guestbook from '../components/Guestbook';
import LiveStage from '../components/LiveStage';
import { API_base_URL, SOCKET_URL } from '../config';
import { EventRoomSkeleton } from '../components/SkeletonLoader';
import { useToast } from '../components/Toast';

interface Participant {
    id: string;
    name: string;
}

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
    const [status, setStatus] = useState<'Upcoming' | 'Live' | 'Ended'>('Upcoming');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            let newTimeLeft = null;

            if (difference > 0) {
                newTimeLeft = {
                    d: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    h: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    m: Math.floor((difference / 1000 / 60) % 60),
                    s: Math.floor((difference / 1000) % 60),
                };
                setStatus('Upcoming');
            } else if (difference > -1000 * 60 * 60 * 4) { // assume events last 4 hours max
                setStatus('Live');
            } else {
                setStatus('Ended');
            }
            setTimeLeft(newTimeLeft);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    if (status === 'Ended') return <div className={styles.countdown}><span className={styles.countdownLabel}>Status</span><span className={styles.countdownTime} style={{ color: '#aaa' }}>Ended</span></div>;
    if (status === 'Live') return <div className={styles.countdown}><span className={styles.countdownLabel}>Status</span><span className={styles.countdownTime} style={{ color: '#ef4444' }}>LIVE 🔴</span></div>;

    return (
        <div className={styles.countdown}>
            <span className={styles.countdownLabel}>Starts In</span>
            <div className={styles.countdownTime}>
                {timeLeft ? `${timeLeft.d > 0 ? timeLeft.d + 'd ' : ''}${timeLeft.h}h ${timeLeft.m}m` : '...'}
            </div>
        </div>
    );
};

const EventRoom = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('memory-wall');

    // Chat / Participants state
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Check Auth & Initialize Socket
    useEffect(() => {
        if (!id) return;

        // Check for user/guest
        if (!user.name && !user.token) {
            navigate(`/join-event?eventId=${id}`);
            return;
        }

        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            // Modified emit to send user name
            newSocket.emit('joinRoom', { eventId: id, user: user.name || 'Guest' });
        });

        newSocket.on('message', (msg: any) => {
            setMessages(prev => [...prev, msg]);
        });

        newSocket.on('roomUsers', (users: Participant[]) => {
            // Deduplicate by ID
            const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
            setParticipants(uniqueUsers);
        });

        // Clean up
        return () => {
            newSocket.disconnect();
        };
    }, [id]);

    // Apply auto-scroll to chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`${API_base_URL}/api/events/${id}`);
                if (res.data.success) {
                    setEvent(res.data.event);
                }
            } catch (err: any) {
                console.error("Error fetching event", err);
                setError(err.response?.data?.error || 'Failed to load event');
            } finally {
                // Artificial delay for skeleton demonstration
                setTimeout(() => setLoading(false), 800);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim() && socket) {
            const userName = user?.name || 'Guest';
            socket.emit('chatMessage', { eventId: id, user: userName, message: chatInput });
            setChatInput('');
        }
    };

    const handleDownloadKeepsake = async () => {
        try {
            showToast('Generating keepsake... please wait', 'info');
            const res = await axios.get(`${API_base_URL}/api/keepsake/${id}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `keepsake-${event.title}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Keepsake downloaded successfully!', 'success');
        } catch (err) {
            console.error("Download failed", err);
            showToast("Failed to download keepsake", 'error');
        }
    };

    if (loading) return <EventRoomSkeleton />;
    if (error) return <div className={styles.errorContainer}><h2>Error</h2><p>{error}</p><Link to="/">Go Home</Link></div>;
    if (!event) return <div className={styles.errorContainer}><h2>Event Not Found</h2><Link to="/">Go Home</Link></div>;

    return (
        <div className={styles.container}>
            <header className={styles.header} style={{ backgroundImage: event.bannerUrl ? `url(${event.bannerUrl})` : 'none' }}>
                <div className={styles.overlay}>
                    <div className={styles.headerContent}>
                        <div className={styles.headerLeft}>
                            <h1>Farewell {event.guestOfHonor}</h1>
                            <p>{event.title} • Hosted by {event.hostName || event.host?.name || 'Host'}</p>
                        </div>
                        <CountdownTimer targetDate={event.eventDate} />
                    </div>
                </div>
            </header>

            <nav className={styles.navTabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'memory-wall' ? styles.active : ''}`}
                    onClick={() => setActiveTab('memory-wall')}>
                    Memory Wall
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'guestbook' ? styles.active : ''}`}
                    onClick={() => setActiveTab('guestbook')}>
                    Guestbook
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'live' ? styles.active : ''}`}
                    onClick={() => setActiveTab('live')}>
                    Live Video Call 📹
                </button>
                <button className={styles.downloadBtn} onClick={handleDownloadKeepsake}>
                    Download Keepsake 📥
                </button>
            </nav>

            <main className={styles.mainContent}>
                {activeTab === 'memory-wall' && <MemoryWall eventId={id!} socket={socket} />}
                {activeTab === 'guestbook' && <Guestbook eventId={id!} />}
                {activeTab === 'live' && (
                    <LiveStage
                        eventId={id!}
                        socket={socket}
                        isHost={user.id === event?.hostId}
                        userName={user.name || 'Guest'}
                    />
                )}
            </main>

            <aside className={styles.sidebar}>
                {/* Participant List */}
                <div className={styles.participantsList}>
                    <h3>Online ({participants.length})</h3>
                    {participants.map((p, idx) => (
                        <div key={idx} className={styles.participant}>
                            <div className={styles.pAvatar}>{p.name.charAt(0).toUpperCase()}</div>
                            <span>{p.name}</span>
                        </div>
                    ))}
                </div>

                {/* Chat */}
                <div className={styles.chatContainer}>
                    <h3>Live Chat</h3>
                    <div className={styles.chatMessages}>
                        <p className={styles.systemMsg}>Welcome to the chat!</p>
                        {messages.map((msg) => (
                            <div key={msg.id} className={styles.chatMessage}>
                                <strong>{msg.user}</strong>
                                <span>{msg.text}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <form className={styles.chatInputArea} onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                        />
                    </form>
                </div>
            </aside>
        </div>
    );
};

export default EventRoom;
