import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface LiveStageProps {
    eventId: string;
    socket: Socket | null;
    isHost: boolean;
    userName: string;
}

interface RemotePeer {
    socketId: string;
    userName: string;
    stream: MediaStream | null;
    pc: RTCPeerConnection;
}

const configuration: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const LiveStage = ({ eventId, socket, isHost, userName }: LiveStageProps) => {
    const [streaming, setStreaming] = useState(false);
    const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
    const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RemotePeer>>(new Map());

    // Create a peer connection for a remote user
    const createPeerConnection = useCallback(
        (targetSocketId: string, targetUserName: string, localStream: MediaStream) => {
            if (peersRef.current.has(targetSocketId)) return peersRef.current.get(targetSocketId)!;

            const pc = new RTCPeerConnection(configuration);

            // Add our local tracks to the connection
            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

            // When we receive remote tracks
            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                const existingPeer = peersRef.current.get(targetSocketId);
                if (existingPeer) {
                    existingPeer.stream = remoteStream;
                    peersRef.current.set(targetSocketId, existingPeer);
                }
                // Force re-render
                setRemotePeers(Array.from(peersRef.current.values()));
            };

            // ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket?.emit('ice-candidate', {
                        target: targetSocketId,
                        candidate: event.candidate,
                    });
                }
            };

            pc.oniceconnectionstatechange = () => {
                if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                    removePeer(targetSocketId);
                }
            };

            const peer: RemotePeer = { socketId: targetSocketId, userName: targetUserName, stream: null, pc };
            peersRef.current.set(targetSocketId, peer);
            setRemotePeers(Array.from(peersRef.current.values()));

            return peer;
        },
        [socket]
    );

    const removePeer = useCallback((socketId: string) => {
        const peer = peersRef.current.get(socketId);
        if (peer) {
            peer.pc.close();
            peersRef.current.delete(socketId);
            setRemotePeers(Array.from(peersRef.current.values()));
        }
    }, []);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        // When a new user joins the live stage and we are already streaming
        const handleUserJoined = async ({
            socketId,
            userName: joinerName,
        }: {
            socketId: string;
            isHost: boolean;
            userName: string;
        }) => {
            console.log(`User ${joinerName} (${socketId}) joined the live stage`);
            if (!localStreamRef.current) return; // We're not streaming yet

            // Create a peer connection and send an offer
            const peer = createPeerConnection(socketId, joinerName, localStreamRef.current);
            if (!peer) return;

            try {
                const offer = await peer.pc.createOffer();
                await peer.pc.setLocalDescription(offer);
                socket.emit('offer', {
                    target: socketId,
                    sdp: offer,
                    caller: socket.id,
                    callerName: userName,
                });
            } catch (err) {
                console.error('Error creating offer:', err);
            }
        };

        // Received an offer from another user
        const handleOffer = async ({
            sdp,
            caller,
            callerName,
        }: {
            sdp: RTCSessionDescriptionInit;
            caller: string;
            callerName: string;
        }) => {
            console.log('Received offer from', callerName);
            if (!localStreamRef.current) return; // We need to be streaming to answer

            const peer = createPeerConnection(caller, callerName, localStreamRef.current);
            if (!peer) return;

            try {
                await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await peer.pc.createAnswer();
                await peer.pc.setLocalDescription(answer);
                socket.emit('answer', {
                    target: caller,
                    sdp: answer,
                    responder: socket.id,
                    responderName: userName,
                });
            } catch (err) {
                console.error('Error handling offer:', err);
            }
        };

        // Received an answer
        const handleAnswer = async ({
            sdp,
            responder,
            responderName,
        }: {
            sdp: RTCSessionDescriptionInit;
            responder: string;
            responderName: string;
        }) => {
            console.log('Received answer from', responderName);
            const peer = peersRef.current.get(responder);
            if (peer) {
                try {
                    await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
                } catch (err) {
                    console.error('Error setting remote description:', err);
                }
            }
        };

        // ICE candidate
        const handleCandidate = async ({
            candidate,
            from,
        }: {
            candidate: RTCIceCandidateInit;
            from: string;
        }) => {
            const peer = peersRef.current.get(from);
            if (peer) {
                try {
                    await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding ICE candidate:', e);
                }
            }
        };

        // User left
        const handleUserLeft = ({ socketId }: { socketId: string }) => {
            console.log('User left live stage:', socketId);
            removePeer(socketId);
        };

        // Reactions
        const handleReaction = ({ emoji, id }: { emoji: string; id: string }) => {
            const x = Math.random() * 80 + 10;
            setReactions((prev) => [...prev, { id, emoji, x }]);
            setTimeout(() => {
                setReactions((prev) => prev.filter((r) => r.id !== id));
            }, 2000);
        };

        socket.on('userJoinedLive', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleCandidate);
        socket.on('userLeftLive', handleUserLeft);
        socket.on('reaction', handleReaction);

        return () => {
            socket.off('userJoinedLive', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleCandidate);
            socket.off('userLeftLive', handleUserLeft);
            socket.off('reaction', handleReaction);
        };
    }, [socket, userName, createPeerConnection, removePeer]);

    // Start camera and join live stage
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            setStreaming(true);

            // Tell the server we're joining the live stage
            socket?.emit('joinLive', { eventId, isHost, userName });
        } catch (err) {
            console.error('Failed to access camera', err);
            alert('Could not access camera/microphone. Please check your browser permissions.');
        }
    };

    // Stop camera and leave
    const stopCamera = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }

        // Close all peer connections
        peersRef.current.forEach((peer) => peer.pc.close());
        peersRef.current.clear();
        setRemotePeers([]);
        setStreaming(false);

        socket?.emit('leaveLive', { eventId });
    };

    const sendReaction = (emoji: string) => {
        socket?.emit('reaction', { eventId, emoji });
    };

    // Calculate grid layout
    const totalParticipants = remotePeers.length + (streaming ? 1 : 0);
    const gridCols = totalParticipants <= 1 ? 1 : totalParticipants <= 4 ? 2 : 3;

    return (
        <div
            style={{
                position: 'relative',
                padding: '1.5rem',
                textAlign: 'center',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
                overflow: 'hidden',
            }}
        >
            <h2 style={{ marginBottom: '1rem', color: '#B3CFE5' }}>
                Live Video Call {isHost && '(Host)'}
            </h2>

            {/* Reactions Overlay */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
                {reactions.map((r) => (
                    <div
                        key={r.id}
                        style={{
                            position: 'absolute',
                            left: `${r.x}%`,
                            bottom: '0',
                            fontSize: '2rem',
                            animation: `floatUp 2s ease-out forwards`,
                            opacity: 1,
                        }}
                    >
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

            {/* Video Grid */}
            {streaming ? (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                        gap: '10px',
                        maxWidth: '900px',
                        margin: '0 auto',
                    }}
                >
                    {/* Local video (You) */}
                    <div
                        style={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            background: '#000',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '2px solid #4CAF50',
                        }}
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '8px',
                                background: 'rgba(0,0,0,0.7)',
                                padding: '4px 10px',
                                borderRadius: '4px',
                                color: '#4CAF50',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                            }}
                        >
                            You {isHost ? '(Host)' : ''}
                        </div>
                    </div>

                    {/* Remote videos */}
                    {remotePeers.map((peer) => (
                        <RemoteVideo key={peer.socketId} peer={peer} />
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '300px',
                        gap: '1rem',
                    }}
                >
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            border: '2px dashed rgba(255,255,255,0.2)',
                        }}
                    >
                        🎥
                    </div>
                    <p style={{ color: '#aaa', fontSize: '1.1rem' }}>
                        Join the video call to see and be seen by everyone!
                    </p>
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {!streaming ? (
                    <button
                        onClick={startCamera}
                        style={{
                            padding: '14px 28px',
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                            fontWeight: 'bold',
                        }}
                    >
                        Join Video Call 📹
                    </button>
                ) : (
                    <button
                        onClick={stopCamera}
                        style={{
                            padding: '14px 28px',
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
                            fontWeight: 'bold',
                        }}
                    >
                        Leave Call ✋
                    </button>
                )}
            </div>

            {/* Reactions Bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    background: 'rgba(255,255,255,0.08)',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    width: 'fit-content',
                    margin: '1rem auto 0',
                }}
            >
                {['❤️', '👏', '😂', '😮', '😢', '🎉'].map((emoji) => (
                    <button
                        type="button"
                        key={emoji}
                        onClick={() => sendReaction(emoji)}
                        style={{
                            fontSize: '1.5rem',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                        }}
                        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.8)')}
                        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                {streaming
                    ? `${totalParticipants} participant${totalParticipants !== 1 ? 's' : ''} in the call`
                    : 'Click "Join Video Call" to share your camera with everyone'}
            </p>
        </div>
    );
};

// Separate component to handle remote video refs
const RemoteVideo = ({ peer }: { peer: RemotePeer }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div
            style={{
                position: 'relative',
                aspectRatio: '16/9',
                background: '#000',
                borderRadius: '10px',
                overflow: 'hidden',
                border: '2px solid rgba(179, 207, 229, 0.3)',
            }}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {!peer.stream && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: '0.9rem',
                    }}
                >
                    Connecting...
                </div>
            )}
            <div
                style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '0.75rem',
                }}
            >
                {peer.userName}
            </div>
        </div>
    );
};

export default LiveStage;
