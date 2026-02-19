import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import styles from './EventRoom.module.css';
import MemoryWall from '../components/MemoryWall';
import Guestbook from '../components/Guestbook';
import LiveStage from '../components/LiveStage';
import { API_base_URL, SOCKET_URL } from '../config';

const EventRoom = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('memory-wall');

    // Chat state
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const navigate = useNavigate();

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
            newSocket.emit('joinRoom', id);
        });

        newSocket.on('message', (msg: any) => {
            setMessages(prev => [...prev, msg]);
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
                setLoading(false);
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

    // in nav or header
    const handleDownloadKeepsake = async () => {
        try {
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
        } catch (err) {
            console.error("Download failed", err);
            alert("Failed to download keepsake");
        }
    };

    if (loading) return <div className={styles.loading}>Entering Event Room...</div>;
    if (error) return <div className={styles.errorContainer}><h2>Error</h2><p>{error}</p><Link to="/">Go Home</Link></div>;
    if (!event) return <div className={styles.errorContainer}><h2>Event Not Found</h2><Link to="/">Go Home</Link></div>;

    return (
        <div className={styles.container}>
            <header className={styles.header} style={{ backgroundImage: event.bannerUrl ? `url(${event.bannerUrl})` : 'none' }}>
                <div className={styles.overlay}>
                    <h1>Farewell {event.guestOfHonor}</h1>
                    <p>{event.title}</p>
                    <div className={styles.meta}>
                        <span>{new Date(event.eventDate).toLocaleString()}</span>
                        <span>Hosted by {event.host?.name}</span>
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
                <button className={styles.tab} onClick={handleDownloadKeepsake} style={{ marginLeft: 'auto', background: '#e0e0e0', color: '#333' }}>
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
                        isHost={user.id === event?.hostId} // Assuming user.id matches event.hostId
                        userName={user.name || 'Guest'}
                    />
                )}
            </main>

            <aside className={styles.sidebar}>
                <div className={styles.chatContainer}>
                    <h3>Live Chat</h3>
                    <div className={styles.chatMessages}>
                        <p className={styles.systemMsg}>Welcome to the chat!</p>
                        {messages.map((msg) => (
                            <div key={msg.id} className={styles.chatMessage}>
                                <strong>{msg.user}: </strong>
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
