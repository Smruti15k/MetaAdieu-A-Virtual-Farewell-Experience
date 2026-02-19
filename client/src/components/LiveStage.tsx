import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface LiveStageProps {
    eventId: string;
    socket: Socket | null;
    isHost: boolean;
    userName: string;
}

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
    ],
};

const LiveStage = ({ eventId, socket, isHost, userName }: LiveStageProps) => {
    const [streaming, setStreaming] = useState(false);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [status, setStatus] = useState('Waiting for host to start broadcast...');
    const [reactions, setReactions] = useState<{ id: string, emoji: string, x: number }[]>([]);

    // Store PeerConnections mapping socketId -> RTCPeerConnection
    const peersRef = useRef<{ [key: string]: RTCPeerConnection }>({});
    const localStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!socket) return;

        console.log(`Joining Live Stage as ${isHost ? 'Host' : 'Guest'}`);
        socket.emit('joinLive', { eventId, isHost });

        const handleUserJoined = async ({ socketId, isHost: joinerIsHost }: { socketId: string, isHost: boolean }) => {
            console.log(`User ${socketId} joined. Is Host: ${joinerIsHost}`);
            if (isHost) {
                if (localStreamRef.current) {
                    console.log(`Initiating connection to ${socketId}`);
                    createPeerConnection(socketId, localStreamRef.current);
                }
            } else {
                if (joinerIsHost) {
                    setStatus('Host joined the stage. Waiting for stream...');
                }
            }
        };

        const handleOffer = async ({ sdp, caller }: { sdp: RTCSessionDescriptionInit, caller: string }) => {
            if (isHost) return;

            console.log('Received offer from', caller);
            setStatus('Live transmission starting...');

            const pc = new RTCPeerConnection(configuration);
            peersRef.current[caller] = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { target: caller, candidate: event.candidate });
                }
            };

            pc.ontrack = (event) => {
                console.log('Received track');
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('answer', { target: caller, sdp: answer, responder: socket.id });
        };

        const handleAnswer = async ({ sdp, responder }: { sdp: RTCSessionDescriptionInit, responder: string }) => {
            console.log('Received answer from', responder);
            const pc = peersRef.current[responder];
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        };

        const handleCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            Object.values(peersRef.current).forEach(pc => {
                pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error(e));
            });
        };

        const handleReaction = ({ emoji, id }: { emoji: string, id: string }) => {
            const x = Math.random() * 80 + 10;
            setReactions(prev => [...prev, { id, emoji, x }]);
            setTimeout(() => {
                setReactions(prev => prev.filter(r => r.id !== id));
            }, 2000);
        };

        socket.on('userJoinedLive', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleCandidate);
        socket.on('reaction', handleReaction);

        return () => {
            socket.off('userJoinedLive', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleCandidate);
            socket.off('reaction', handleReaction);
        };
    }, [socket, isHost, eventId]);

    const startBroadcast = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setStreaming(true);
            setStatus('Broadcasting live...');
        } catch (err) {
            console.error("Failed to access camera", err);
            setStatus('Checking camera permissions...');
            alert("Could not access camera/microphone");
        }
    };

    const stopBroadcast = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        setStreaming(false);
        Object.values(peersRef.current).forEach(pc => pc.close());
        peersRef.current = {};
        setStatus('Broadcast stopped.');
    };

    const createPeerConnection = async (targetSocketId: string, stream: MediaStream) => {
        if (peersRef.current[targetSocketId]) return;

        const pc = new RTCPeerConnection(configuration);
        peersRef.current[targetSocketId] = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.emit('ice-candidate', { target: targetSocketId, candidate: event.candidate });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('offer', { target: targetSocketId, sdp: offer, caller: socket?.id });
    };

    const sendReaction = (emoji: string) => {
        socket?.emit('reaction', { eventId, emoji });
    };

    return (
        <div style={{ position: 'relative', padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
            <h2 style={{ marginBottom: '1rem', color: '#B3CFE5' }}>Live Broadcast Stage</h2>

            {/* Reactions Overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
                {reactions.map(r => (
                    <div key={r.id} style={{
                        position: 'absolute',
                        left: `${r.x}%`,
                        bottom: '0',
                        fontSize: '2rem',
                        animation: `floatUp 2s ease-out forwards`,
                        opacity: 1
                    }}>
                        {r.emoji}
                    </div>
                ))}
                <style>{`
                    @keyframes floatUp {
                        0% { transform: translateY(0) scale(0.5); opacity: 1; }
                        100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
                    }
                `}</style>
            </div>

            {isHost ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '700px', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {!streaming && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Camera Off</div>}
                    </div>

                    {/* Reactions Bar for Host too */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        {['❤️', '👏', '😂', '😮', '😢', '🎉'].map(emoji => (
                            <button type="button" key={emoji} onClick={() => sendReaction(emoji)} style={{ fontSize: '1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }}>{emoji}</button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {!streaming ? (
                            <button
                                onClick={startBroadcast}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '1.1rem',
                                    background: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '30px',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)'
                                }}>
                                Start Broadcast 🎥
                            </button>
                        ) : (
                            <button
                                onClick={stopBroadcast}
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '1.1rem',
                                    background: '#34495e',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '30px',
                                    cursor: 'pointer'
                                }}>
                                Stop Broadcast ⏹️
                            </button>
                        )}
                    </div>
                    <p style={{ color: '#aaa', fontSize: '0.9rem' }}>You are the Host. Guests will see your camera feed.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '5px 10px', borderRadius: '4px', color: 'white', fontSize: '0.8rem' }}>
                            {status}
                        </div>
                    </div>

                    {/* Reactions Bar */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '50px' }}>
                        {['❤️', '👏', '😂', '😮', '😢', '🎉'].map(emoji => (
                            <button type="button" key={emoji} onClick={() => sendReaction(emoji)} style={{ fontSize: '2rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.8)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>{emoji}</button>
                        ))}
                    </div>
                    <p style={{ color: '#aaa' }}>Join the conversation in the chat!</p>
                </div>
            )}
        </div>
    );
};

export default LiveStage;
