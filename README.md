# Screen Share Project

Welcome to the Screen Share Project! This is a simple peer-to-peer screen-sharing application built using HTML, JavaScript, and WebRTC with PeerJS. It allows you to share your screen from a sender device and view it on a separate viewer device via a QR code.

## Features
- Share your screen from a desktop or laptop.
- View the shared screen on another device (e.g., phone or another browser tab) by scanning a QR code.
- Resizable video display with built-in controls on the viewer page.
- Secure peer-to-peer connection using WebRTC.
- No server-side stream handling—relies on client-side PeerJS for signaling.

## Prerequisites
- A modern web browser (Chrome, Firefox, Edge) that supports `getDisplayMedia` and WebRTC.
- Internet connection for PeerJS signaling and CDN resources.

## Local Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```
2. For local testing with HTTPS (required for `getDisplayMedia`):
   - Use the provided `server.py` script (requires Python with `http.server` and `ssl` modules).
   - Generate a self-signed certificate (`localhost.pem`) or use an existing one.
   - Run the script:
     ```bash
     python server.py
     ```
   - Access the app at `https://localhost:4443`.
3. Open `index.html` in your browser to start as the sender.

## Usage
1. **Sender (index.html)**:
   - Click "Start Sharing" to select a window or screen to share.
   - A QR code and URL will appear. Scan the QR code with your phone or open the URL in another browser/device.
2. **Viewer (viewer.html)**:
   - The viewer page will display the shared screen almost full-screen with resizable video and controls.
   - Use the "Reconnect" button if the connection drops.

## Deployment on GitHub Pages
1. Push the `index.html`, `viewer.html`, and `app.js` files to your GitHub repository.
2. Enable GitHub Pages in the repository settings (set source to `main` branch).
3. Access the app at `https://yourusername.github.io/your-repo/`.
   - Sender: `https://yourusername.github.io/your-repo/`
   - Viewer: `https://yourusername.github.io/your-repo/viewer.html?view=peerId`

## Notes
- The app uses PeerJS cloud servers for signaling. Ensure they are accessible from your network.
- For production, consider a custom domain with HTTPS on GitHub Pages for better user trust.
- Test on multiple devices to ensure compatibility.

## Contributing
Feel free to fork this repository, make improvements, and submit pull requests!

## License
This project is open-source. See the [LICENSE](LICENSE) file for details (add your preferred license).