import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_base_URL } from '../config';
import { auth } from '../firebase';
import styles from './MemoryWall.module.css';

interface Post {
    id: number;
    type: 'text' | 'photo' | 'video';
    content: string;
    caption: string;
    createdAt: string;
    author: {
        name: string;
        profilePicture?: string;
    }
}

interface MemoryWallProps {
    eventId: string;
    socket: any; // Socket type
}

const MemoryWall = ({ eventId, socket }: MemoryWallProps) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [postType, setPostType] = useState<'text' | 'photo' | 'video'>('text');
    const [textContent, setTextContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState('');

    useEffect(() => {
        fetchPosts();

        // Socket listener for real-time updates
        if (socket) {
            socket.on('newPost', (newPost: Post) => {
                setPosts(prevPosts => {
                    if (prevPosts.some(p => p.id === newPost.id)) return prevPosts;
                    return [newPost, ...prevPosts];
                });
            });
        }

        return () => {
            if (socket) socket.off('newPost');
        };
    }, [eventId, socket]);

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`${API_base_URL}/api/posts/event/${eventId}`);
            if (res.data.success) {
                setPosts(res.data.posts);
            }
        } catch (error) {
            console.error("Failed to fetch posts", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get a fresh Firebase ID token
    const getFreshToken = async (): Promise<string | null> => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                // Force refresh to get a non-expired token
                const token = await currentUser.getIdToken(true);
                return token;
            } catch (err) {
                console.error("Failed to refresh Firebase token:", err);
                return null;
            }
        }
        // Fallback to localStorage (for guest sessions)
        return localStorage.getItem('token');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Get token if available (authenticated user)
        const token = await getFreshToken();

        // Get user info from localStorage (works for both logged-in and guest users)
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const guestName = storedUser.name || 'Guest';

        // Need either a token OR a guest name to post
        if (!token && !storedUser.name) {
            alert("Please login or join the event to post");
            return;
        }

        setIsPosting(true);
        const formData = new FormData();
        formData.append('eventId', eventId);
        formData.append('type', postType);
        formData.append('caption', caption);
        formData.append('guestName', guestName);

        if (postType === 'text') {
            formData.append('content', textContent);
        } else if (file) {
            formData.append('file', file);
        }

        try {
            const config: any = {
                headers: {}
            };

            // Only send auth header if we have a token
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(`${API_base_URL}/api/posts`, formData, config);
            if (response.data.success) {
                const myNewPost = response.data.post;
                setPosts(prev => {
                    if (prev.find(p => p.id === myNewPost.id)) return prev;
                    return [myNewPost, ...prev];
                });

                setShowForm(false);
                setTextContent('');
                setCaption('');
                setFile(null);
                setPostType('text'); // Reset to default
            }
        } catch (error: any) {
            console.error("Post failed", error);
            const errorMsg = error.response?.data?.error || 'Failed to post memory';
            alert(errorMsg);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Memory Wall</h2>
                <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '+ Add Memory'}
                </button>
            </div>

            {showForm && (
                <form className={styles.postForm} onSubmit={handleSubmit}>
                    <div className={styles.typeSelector}>
                        <button type="button"
                            className={`${styles.typeBtn} ${postType === 'text' ? styles.activeType : ''}`}
                            onClick={() => setPostType('text')}>
                            Text Note
                        </button>
                        <button type="button"
                            className={`${styles.typeBtn} ${postType === 'photo' ? styles.activeType : ''}`}
                            onClick={() => setPostType('photo')}>
                            Photo
                        </button>
                        <button type="button"
                            className={`${styles.typeBtn} ${postType === 'video' ? styles.activeType : ''}`}
                            onClick={() => setPostType('video')}>
                            Video
                        </button>
                    </div>

                    {postType === 'text' ? (
                        <textarea
                            className={styles.textArea}
                            value={textContent}
                            onChange={e => setTextContent(e.target.value)}
                            placeholder="Share a thought or memory..."
                            required
                        />
                    ) : (
                        <div className={styles.fileInput}>
                            <input
                                type="file"
                                accept={postType === 'photo' ? "image/*" : "video/mp4,video/webm,video/ogg"}
                                onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                                required
                            />
                            {postType === 'video' && <small>Max video size: 50MB</small>}
                        </div>
                    )}

                    <input
                        type="text"
                        className={styles.captionInput}
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        placeholder="Add a caption (optional)..."
                    />

                    <button type="submit" className={styles.submitBtn} disabled={isPosting}>
                        {isPosting ? 'Posting...' : 'Post to Wall'}
                    </button>
                </form>
            )}

            {loading ? <p>Loading memories...</p> : (
                <div className={styles.grid}>
                    {posts.length === 0 ? <p className={styles.empty}>No memories yet. Be the first!</p> : (
                        posts.map(post => (
                            <div key={post.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.author}>{post.author.name}</span>
                                    <span className={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className={styles.cardContent}>
                                    {post.type === 'photo' ? (
                                        <img src={post.content} alt={post.caption || 'Memory'} loading="lazy" />
                                    ) : post.type === 'video' ? (
                                        <video controls className={styles.postVideo}>
                                            <source src={post.content} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <p className={styles.textContent}>{post.content}</p>
                                    )}
                                </div>
                                {post.caption && <p className={styles.caption}>{post.caption}</p>}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MemoryWall;
