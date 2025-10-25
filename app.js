// Configuration - using PeerJS cloud server with reduced STUN/TURN servers
const PEERJS_CONFIG = {
    host: '0.peerjs.com',
    secure: false,
    port: 443,
    path: '/',
    debug: 2
};

// Check if this is sender or viewer
const urlParams = new URLSearchParams(window.location.search);
const isViewer = urlParams.has('view') && window.location.pathname.includes('viewer.html');
const senderId = urlParams.get('view');

// Initialize based on role and page
if (isViewer) {
    initViewer(senderId);
} else {
    initSender();
}

// SENDER FUNCTIONALITY
function initSender() {
    document.getElementById('senderView').classList.remove('hidden');
    document.getElementById('viewerView').classList.add('hidden');

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const qrcodeSection = document.getElementById('qrcodeSection');
    const statusMessage = document.getElementById('statusMessage');
    const connectedCounter = document.getElementById('connectedCounter');

    let peer = null;
    let localStream = null;
    let viewerPeerId = null;
    let connectedPeers = new Set(); // Track connected viewer IDs

    startBtn.addEventListener('click', async () => {
        try {
            showStatus('Requesting screen access...', 'info');

            // Get screen stream
            localStream = await navigator.mediaDevices.getDisplayMedia({
              video: {
                cursor: 'always',
                displaySurface: 'window',
                frameRate: 60
              },
              audio: false
            });

            localStream.getVideoTracks()[0].addEventListener('ended', () => {
                stopSharing();
            });

            // Create peer connection
            const peerId = generateId();
            peer = new Peer(peerId, PEERJS_CONFIG);

            peer.on('open', (id) => {
                console.log('Sender peer ID:', id);
                showStatus('Ready to connect!', 'success');
                displayQRCode(id);
                startBtn.classList.add('hidden');
                stopBtn.classList.remove('hidden');
                qrcodeSection.classList.remove('hidden');
                updateConnectedCounter();
            });

            peer.on('connection', (conn) => {
                console.log('Data connection received from viewer');
                conn.on('open', () => {
                    conn.on('data', (data) => {
                        viewerPeerId = data;
                        console.log('Received viewer peer ID:', viewerPeerId);
                        connectedPeers.add(viewerPeerId); // Add viewer to connected peers
                        updateConnectedCounter();
                        initiateCallToViewer();
                    });
                    conn.on('close', () => {
                        console.log('Data connection closed for viewer:', conn.peer);
                        connectedPeers.delete(conn.peer); // Remove viewer from connected peers
                        updateConnectedCounter();
                    });
                });
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
                showStatus(`Error: ${err.type}`, 'warning');
            });

        } catch (err) {
            console.error('Error starting screen share:', err);
            showStatus('Failed to start screen share. Please try again.', 'warning');
        }
    });

    stopBtn.addEventListener('click', () => {
        stopSharing();
    });

    function stopSharing() {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
        }
        if (peer) {
            peer.destroy();
            peer = null;
        }
        viewerPeerId = null;
        connectedPeers.clear(); // Clear all connected peers
        updateConnectedCounter();
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        qrcodeSection.classList.add('hidden');
        document.getElementById('qrcode').innerHTML = '';
        statusMessage.innerHTML = '';
    }

    function displayQRCode(peerId) {
        // Use the full GitHub Pages URL with the repository name
        const repoName = window.location.pathname.split('/')[1]; // Extracts 'your-repo' from the path
        const baseUrl = window.location.origin + (repoName ? '/' + repoName : '');
        const viewerUrl = `${baseUrl}/viewer.html?view=${peerId}`;
        document.getElementById('qrcode').innerHTML = '';
        new QRCode(document.getElementById('qrcode'), {
            text: viewerUrl,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        document.getElementById('viewerUrl').textContent = viewerUrl;
    }

    function showStatus(message, type) {
        statusMessage.innerHTML = `<div class="status ${type}">${message}</div>`;
    }

    function updateConnectedCounter() {
        connectedCounter.textContent = `Connected viewers: ${connectedPeers.size}`;
    }

    function initiateCallToViewer() {
        if (viewerPeerId && localStream) {
            const call = peer.call(viewerPeerId, localStream);
            console.log('Initiated call to viewer:', viewerPeerId);
            call.on('error', (err) => {
                console.error('Call error:', err);
                showStatus(`Error: ${err.message}`, 'warning');
            });
            call.on('close', () => {
                console.log('Call closed');
            });
        }
    }
}

// VIEWER FUNCTIONALITY
function initViewer(senderId) {
    const remoteVideo = document.getElementById('remoteVideo');
    const statusEl = document.getElementById('viewerStatus');
    const reconnectBtn = document.getElementById('reconnectBtn');

    let peer = null;

    function startConnection() {
        statusEl.textContent = 'Connecting to screen share...';
        statusEl.classList.add('info');
        statusEl.classList.remove('success', 'warning');
        reconnectBtn.classList.add('hidden');

        peer = new Peer(PEERJS_CONFIG);

        peer.on('open', (id) => {
            console.log('Viewer peer opened with ID:', id);

            // Connect to sender and send viewer ID
            const conn = peer.connect(senderId);
            conn.on('open', () => {
                conn.send(id); // Send viewer peer ID to sender
                console.log('Sent viewer peer ID to sender:', id);
            });

            // Handle incoming call
            peer.on('call', (call) => {
                console.log('Received call from sender');
                call.answer(); // Answer without sending a stream
                call.on('stream', (remoteStream) => {
                    console.log('Received remote stream:', remoteStream);
                    remoteVideo.srcObject = remoteStream;
                    remoteVideo.play().then(() => {
                        console.log('Video playing successfully');
                        statusEl.textContent = '✓ Connected - Viewing screen';
                        statusEl.classList.remove('info');
                        statusEl.classList.add('success');
                    }).catch(e => {
                        console.error('Error playing video:', e);
                        statusEl.textContent = '❌ Error playing video: ' + e.message;
                        statusEl.classList.add('warning');
                        reconnectBtn.classList.remove('hidden');
                    });
                });
                call.on('error', (err) => {
                    console.error('Call error:', err);
                    statusEl.textContent = `❌ Error: ${err.message}`;
                    statusEl.classList.add('warning');
                    reconnectBtn.classList.remove('hidden');
                });
            });
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            statusEl.textContent = `❌ Connection error: ${err.type}`;
            statusEl.classList.add('warning');
            reconnectBtn.classList.remove('hidden');
        });

        peer.on('disconnected', () => {
            console.log('Peer disconnected');
            statusEl.textContent = 'Disconnected - trying to reconnect...';
            statusEl.classList.add('warning');
            peer.reconnect();
        });
    }

    // Initial connection
    startConnection();

    // Reconnect button handler
    reconnectBtn.addEventListener('click', () => {
        if (peer) peer.destroy();
        startConnection();
    });
}

// Utility function to generate random ID
function generateId() {
    return 'screen-' + Math.random().toString(36).substr(2, 9);
}
