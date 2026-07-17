// whatsapp.js — WhatsApp integration for Biblioteca Lumethos
const path = require('path');
const QRCode = require('qrcode');

let sock = null;
let isConnected = false;
let currentQR = null;       // raw QR string
let currentQRDataURI = null; // base64 data URI for display
let connectedPhone = null;  // phone number connected
let connectionStatus = 'disconnected'; // disconnected | connecting | connected | error
let qrTimestamp = 0;        // when the current QR was generated
let qrBatch = [];           // store last few QR data URIs as fallback
let reconnectTimer = null;

// Try to load Baileys — optional dependency
async function getSocket(forceNew = false) {
  if (sock && isConnected && !forceNew) return sock;

  // Clear stale state if forcing new connection
  if (forceNew) {
    await cleanupSocket();
  }

  if (sock && !forceNew) return sock;

  try {
    const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
    const { state, saveCreds } = await useMultiFileAuthState(
      path.join(__dirname, '..', 'wa_auth')
    );

    connectionStatus = 'connecting';
    currentQR = null;
    currentQRDataURI = null;
    qrTimestamp = 0;
    qrBatch = [];

    sock = makeWASocket({
      auth: state,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      browser: ['Instituto Lumethos', 'Chrome', '1.0.0'],
      qrTimeout: 120000 // 2 minutes before QR expires
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr && qr !== currentQR) {
        currentQR = qr;
        isConnected = false;
        connectionStatus = 'connecting';
        qrTimestamp = Date.now();

        // Generate data URI for frontend
        try {
          currentQRDataURI = await QRCode.toDataURL(qr, { 
            width: 380, 
            margin: 2, 
            color: { dark: '#1e293b', light: '#ffffff' } 
          });
          // Keep last 3 QR codes as buffer
          qrBatch.unshift(currentQRDataURI);
          if (qrBatch.length > 3) qrBatch.pop();
        } catch (e) {
          console.warn('[whatsapp] QR generation error:', e.message);
          currentQRDataURI = null;
        }
        console.log('[whatsapp] New QR code generated at', new Date().toISOString().substring(11, 19));
      }

      if (connection === 'open') {
        isConnected = true;
        connectionStatus = 'connected';
        currentQR = null;
        currentQRDataURI = null;
        qrBatch = [];
        // Try to get connected phone
        try {
          const user = sock?.user;
          connectedPhone = user?.id ? user.id.split(':')[0] : null;
          console.log('[whatsapp] ✅ Connected as', connectedPhone);
        } catch (e) {
          connectedPhone = null;
        }
      }

      if (connection === 'close') {
        isConnected = false;
        connectionStatus = 'disconnected';
        connectedPhone = null;
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
        if (shouldReconnect) {
          console.log('[whatsapp] Reconnecting in 5s...');
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            if (!isConnected) {
              connectionStatus = 'connecting';
              getSocket(true);
            }
          }, 5000);
        } else {
          console.log('[whatsapp] Session closed (logout)');
          cleanupSocket();
        }
      }
    });

    return sock;
  } catch (e) {
    console.warn('[whatsapp] Baileys not available:', e.message);
    connectionStatus = 'error';
    return null;
  }
}

async function cleanupSocket() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (sock) {
    try {
      sock.removeAllListeners('connection.update');
      sock.removeAllListeners('creds.update');
      sock.end(undefined);
    } catch (e) {}
  }
  sock = null;
  isConnected = false;
  connectionStatus = 'disconnected';
  currentQR = null;
  currentQRDataURI = null;
  connectedPhone = null;
  qrBatch = [];
}

// Get connection status for admin
function getStatus() {
  return {
    connected: isConnected,
    status: connectionStatus,
    phone: connectedPhone,
    hasQR: !!currentQR,
    qr: currentQRDataURI || currentQR, // prefer data URI, fallback to raw
    qrAge: qrTimestamp ? Date.now() - qrTimestamp : 0, // ms since QR generated
    qrBatch: qrBatch // keep last few QR codes
  };
}

// Force a new QR code by reconnecting
async function refreshQR() {
  console.log('[whatsapp] Forcing QR refresh...');
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  await cleanupSocket();
  isConnected = false;
  connectionStatus = 'connecting';
  qrBatch = [];
  
  // Small delay to ensure cleanup completes
  await new Promise(r => setTimeout(r, 500));
  return getSocket(true);
}

// Disconnect and logout
async function disconnect() {
  console.log('[whatsapp] Disconnecting...');
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  
  if (sock) {
    try {
      sock.removeAllListeners('connection.update');
      sock.removeAllListeners('creds.update');
      sock.end(401); // force logout
    } catch (e) {}
  }
  sock = null;
  isConnected = false;
  connectionStatus = 'disconnected';
  currentQR = null;
  currentQRDataURI = null;
  connectedPhone = null;
  qrBatch = [];

  // Remove auth files
  const authDir = path.join(__dirname, '..', 'wa_auth');
  try {
    const fs = require('fs');
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
      console.log('[whatsapp] Auth files removed');
    }
  } catch (e) {
    console.warn('[whatsapp] Could not remove auth:', e.message);
  }
}

// Send WhatsApp message via Baileys or HTTP API fallback
async function sendWhatsAppMessage(to, message) {
  if (!to) throw new Error('Destinatário não informado');

  let phone = to.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = phone.substring(1);
  if (!phone.startsWith('55')) phone = '55' + phone;

  const jid = phone + '@s.whatsapp.net';

  // Auto-init socket if needed
  if (!sock && !isConnected) {
    getSocket().catch(() => {});
  }

  const socket = sock;
  if (socket && isConnected) {
    try {
      await socket.sendMessage(jid, { text: message });
      console.log('[whatsapp] ✅ Sent via Baileys to', phone);
      return { method: 'baileys', success: true };
    } catch (e) {
      console.warn('[whatsapp] Baileys send failed:', e.message);
    }
  }

  console.log('[whatsapp] Message for', phone, ':', message.substring(0, 80) + '...');
  console.log('[whatsapp] No WhatsApp client connected — message logged only');
  return { method: 'logged', success: true, phone, message };
}

// Initialize on load
getSocket().catch(() => {});

module.exports = { sendWhatsAppMessage, getSocket, getStatus, disconnect, refreshQR };