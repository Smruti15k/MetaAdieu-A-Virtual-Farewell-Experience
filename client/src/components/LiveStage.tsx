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
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [peerStates, setPeerStates] = useState<Record<string, { isVideoOff: boolean; isMuted: boolean }>>({});
    const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
    const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);

    const localVideoContainerRef = useRef<HTMLDivElement>(null);

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
            setPeerStates((prev) => {
                const newStates = { ...prev };
                delete newStates[socketId];
                return newStates;
            });
        };

        // Reactions
        const handleReaction = ({ emoji, id }: { emoji: string; id: string }) => {
            const x = Math.random() * 80 + 10;
            setReactions((prev) => [...prev, { id, emoji, x }]);
            setTimeout(() => {
                setReactions((prev) => prev.filter((r) => r.id !== id));
            }, 2000);
        };

        // Mute/Unmute All
        const handleMuteAll = () => {
            setIsMuted(true);
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = false));
            }
            socket.emit('peerStateChanged', { eventId, isVideoOff, isMuted: true });
        };

        const handleUnmuteAll = () => {
            setIsMuted(false);
            if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = true));
            }
            socket.emit('peerStateChanged', { eventId, isVideoOff, isMuted: false });
        };

        const handlePeerStateChanged = ({ socketId, isVideoOff, isMuted }: { socketId: string, isVideoOff: boolean, isMuted: boolean }) => {
            setPeerStates((prev) => ({
                ...prev,
                [socketId]: { isVideoOff, isMuted }
            }));
        };

        socket.on('userJoinedLive', handleUserJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleCandidate);
        socket.on('userLeftLive', handleUserLeft);
        socket.on('reaction', handleReaction);
        socket.on('muteAll', handleMuteAll);
        socket.on('unmuteAll', handleUnmuteAll);
        socket.on('peerStateChanged', handlePeerStateChanged);

        return () => {
            socket.off('userJoinedLive', handleUserJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleCandidate);
            socket.off('userLeftLive', handleUserLeft);
            socket.off('reaction', handleReaction);
            socket.off('muteAll', handleMuteAll);
            socket.off('unmuteAll', handleUnmuteAll);
            socket.off('peerStateChanged', handlePeerStateChanged);
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
            setIsMuted(false);
            setIsVideoOff(false);

            // Tell the server we're joining the live stage
            socket?.emit('joinLive', { eventId, isHost, userName });

            // Broadcast initial state after a short delay to ensure others have established connection
            setTimeout(() => {
                socket?.emit('peerStateChanged', { eventId, isVideoOff: false, isMuted: false });
            }, 1000);
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

    // Attach stream to video element when it mounts
    useEffect(() => {
        if (streaming && localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [streaming]);

    const sendReaction = (emoji: string) => {
        socket?.emit('reaction', { eventId, emoji });
    };

    // Calculate grid layout
    const totalParticipants = remotePeers.length + (streaming ? 1 : 0);
    const gridCols = totalParticipants <= 1 ? 1 : totalParticipants <= 4 ? 2 : 3;

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const newMutedState = !audioTrack.enabled;
                audioTrack.enabled = !newMutedState;
                setIsMuted(newMutedState);
                socket?.emit('peerStateChanged', { eventId, isVideoOff, isMuted: newMutedState });
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                const newVideoOffState = !videoTrack.enabled;
                videoTrack.enabled = !newVideoOffState;
                setIsVideoOff(newVideoOffState);
                socket?.emit('peerStateChanged', { eventId, isVideoOff: newVideoOffState, isMuted });
            }
        }
    };

    const muteAllParticipants = () => {
        if (isHost) {
            socket?.emit('muteAll', { eventId });
        }
    };

    const unmuteAllParticipants = () => {
        if (isHost) {
            socket?.emit('unmuteAll', { eventId });
        }
    };

    const toggleFullScreen = (elementRef: React.RefObject<HTMLDivElement | null>) => {
        if (!document.fullscreenElement) {
            elementRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

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
                    <div
                        ref={localVideoContainerRef}
                        style={{
                            position: 'relative',
                            aspectRatio: '16/9',
                            background: '#3c4043',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}
                        onDoubleClick={() => toggleFullScreen(localVideoContainerRef)}
                    >
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transform: 'scaleX(-1)',
                                display: isVideoOff ? 'none' : 'block'
                            }}
                        />
                        {isVideoOff && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: '#5f6368',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}>
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '12px',
                                left: '12px',
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            You {isHost ? '(Host)' : ''}
                        </div>
                        {isMuted && (
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.9rem'
                            }}>
                                🔇
                            </div>
                        )}
                    </div>

                    {/* Remote videos */}
                    {remotePeers.map((peer) => (
                        <RemoteVideo
                            key={peer.socketId}
                            peer={peer}
                            peerState={peerStates[peer.socketId]}
                        />
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
                    <>
                        {isHost && (
                            <>
                                <button
                                    onClick={muteAllParticipants}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '1rem',
                                        background: '#f39c12',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '30px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Mute All
                                </button>
                                <button
                                    onClick={unmuteAllParticipants}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '1rem',
                                        background: '#2ecc71',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '30px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Unmute All
                                </button>
                            </>
                        )}
                        <button
                            onClick={toggleMute}
                            style={{
                                padding: '10px 20px',
                                fontSize: '1rem',
                                background: isMuted ? '#e74c3c' : '#34495e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            {isMuted ? 'Unmute 🎤' : 'Mute 🔇'}
                        </button>
                        <button
                            onClick={toggleVideo}
                            style={{
                                padding: '10px 20px',
                                fontSize: '1rem',
                                background: isVideoOff ? '#e74c3c' : '#34495e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            {isVideoOff ? 'Start Video 📷' : 'Stop Video 🚫'}
                        </button>
                        <button
                            onClick={stopCamera}
                            style={{
                                padding: '10px 20px',
                                fontSize: '1rem',
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
                    </>
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
const RemoteVideo = ({ peer, peerState }: { peer: RemotePeer, peerState?: { isVideoOff: boolean; isMuted: boolean } }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isVideoOff = peerState?.isVideoOff ?? false;
    const isMuted = peerState?.isMuted ?? false;

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                aspectRatio: '16/9',
                background: '#3c4043',
                borderRadius: '12px',
                overflow: 'hidden',
            }}
            onDoubleClick={toggleFullScreen}
        >
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: isVideoOff ? 'none' : 'block'
                }}
            />
            {(!peer.stream || isVideoOff) && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#5f6368', // Material grayish color for avatars
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'white',
                        fontWeight: 'bold'
                    }}>
                        {peer.userName.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
            <div
                style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                }}
            >
                {peer.userName}
            </div>
            {isMuted && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem'
                }}>
                    🔇
                </div>
            )}
        </div>
    );
};

export default LiveStage;
