// ================================================================
// BIBLIOTECA LUMETHOS — Analytics Engine
// Premium Behavioral Analytics + Event Tracking + Dashboard
// ================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '..', '..', 'analytics_data');
const DB_FILE = path.join(DB_DIR, 'analytics_v2.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// In-memory store
let store = { sessions: {}, events: [], clicks: [], pageViews: {} };

function init() {
  try {
    if (fs.existsSync(DB_FILE)) store = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {}
  if (!store.sessions) store.sessions = {};
  if (!store.events) store.events = [];
  if (!store.clicks) store.clicks = [];
  if (!store.pageViews) store.pageViews = {};
  console.log('📊 Biblioteca Analytics Engine — ' + Object.keys(store.sessions).length + ' sessions loaded');
}

function save() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(store)); } catch(e) {}
}

// ---- HELPERS ----
function anonIP(ip) {
  if (!ip) return '::1';
  const parts = ip.split('.');
  if (parts.length === 4) return parts[0] + '.' + parts[1] + '.' + parts[2] + '.0';
  return ip.replace(/([0-9a-f]+:){4}/, 'anon:');
}

function getDevice(ua) {
  ua = (ua || '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) return 'mobile';
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  return 'desktop';
}

function getBrowser(ua) {
  ua = (ua || '').toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edge') && !ua.includes('opr')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opr') || ua.includes('opera')) return 'Opera';
  return 'Outro';
}

function getOS(ua) {
  ua = (ua || '').toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Outro';
}

function generateId() { return crypto.randomBytes(8).toString('hex'); }

function getOrCreateSession(req) {
  const ip = req.headers['x-forwarded-for'] || req.ip || '::1';
  const ua = req.headers['user-agent'] || '';
  const ref = req.headers['referer'] || '';
  const sid = req.cookies?._s || generateId();
  
  if (!store.sessions[sid]) {
    store.sessions[sid] = {
      sid,
      firstVisit: Date.now(),
      lastActivity: Date.now(),
      ip: anonIP(ip),
      ua: ua.slice(0, 200),
      device: getDevice(ua),
      browser: getBrowser(ua),
      os: getOS(ua),
      ref: ref.slice(0, 300),
      pages: [],
      events: 0,
      clicks: 0,
      scroll: 0,
      conversions: 0,
      active: true
    };
  }
  
  const s = store.sessions[sid];
  s.lastActivity = Date.now();
  s.active = true;
  s.events++;
  return s;
}

// ---- TRACKER SCRIPT ----
const TRACKER_SCRIPT = `(function(){
  var sid = document.cookie.replace(/(?:(?:^|.*;\\s*)_s\\s*\\=\\s*([^;]*).*$)|^.*$/, "$1");
  if (!sid || sid === '') {
    sid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    document.cookie = '_s=' + sid + ';path=/;max-age=86400';
  }
  var trackerUrl = '/api/v2/track';
  var startTime = Date.now();
  var lastEvent = startTime;
  var hoverTimer = null;
  var maxScroll = 0;
  var pagePath = window.location.pathname + window.location.search;
  var pageData = { url: window.location.href, title: document.title, ref: document.referrer, w: window.innerWidth, h: window.innerHeight, path: pagePath };

  // Rage click detection
  var clickTimestamps = {};

  // Section time tracking
  var sectionTimers = {};
  var currentSection = null;
  var sectionStart = Date.now();

  function send(data) {
    try {
      data._s = sid;
      data.t = Date.now();
      data.dt = lastEvent > 0 ? Date.now() - lastEvent : 0;
      lastEvent = Date.now();
      data.path = pagePath;
      var blob = new Blob([JSON.stringify(data)], {type:'application/json'});
      navigator.sendBeacon(trackerUrl, blob);
    } catch(e) {}
  }

  // Performance metrics
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', function() {
      setTimeout(function() {
        var perf = window.performance.timing;
        var loadTime = perf.loadEventEnd - perf.navigationStart;
        var domReady = perf.domInteractive - perf.navigationStart;
        if (loadTime > 0) {
          send({ e: 'performance', loadTime: loadTime, domInteractive: domReady });
        }
      }, 0);
    });
  }

  // Page view
  send({ e: 'pageview', url: pageData.url, title: pageData.title, ref: pageData.ref, w: pageData.w, h: pageData.h, path: pagePath });

  // Click tracking
  document.addEventListener('click', function(e) {
    var target = e.target;
    var tag = target.tagName || '';
    var text = (target.innerText || target.textContent || '').trim().slice(0, 60);
    var id = target.id || '';
    var cls = (target.className || '').slice(0, 60);
    var href = target.href || (target.parentElement ? target.parentElement.href : '') || '';
    send({ e: 'click', tag: tag, text: text, id: id, cls: cls, href: href.slice(0, 200), x: e.clientX, y: e.clientY, w: pageData.w, path: pagePath });

    // Rage click detection
    var now = Date.now();
    var key = tag + ':' + (id || text || href.slice(0, 30));
    if (!clickTimestamps[key]) clickTimestamps[key] = [];
    clickTimestamps[key] = clickTimestamps[key].filter(function(ts) { return now - ts < 2000; });
    clickTimestamps[key].push(now);
    if (clickTimestamps[key].length >= 3) {
      send({ e: 'rage_click', tag: tag, text: text, id: id, key: key.slice(0, 80), count: clickTimestamps[key].length });
      clickTimestamps[key] = [];
    }
  }, true);

  // Scroll tracking
  var scrollTimer = null;
  document.addEventListener('scroll', function() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() {
      var docEl = document.documentElement;
      var scrollPct = Math.round(((docEl.scrollTop + window.innerHeight) / Math.max(docEl.scrollHeight, 1)) * 100);
      if (scrollPct > maxScroll) {
        maxScroll = scrollPct;
        send({ e: 'scroll', pct: Math.min(scrollPct, 100), maxScroll: Math.min(maxScroll, 100), path: pagePath });
      }
    }, 300);
  }, { passive: true });

  // Tab visibility
  document.addEventListener('visibilitychange', function() {
    send({ e: document.hidden ? 'tab_hide' : 'tab_show', duration: Math.round((Date.now() - startTime) / 1000), path: pagePath });
  });

  // Heartbeat every 15s
  setInterval(function() {
    var onPage = Math.round((Date.now() - startTime) / 1000);
    send({ e: 'heartbeat', onPage: onPage, scrollMax: Math.min(maxScroll, 100), path: pagePath });
  }, 15000);

  // Before unload
  window.addEventListener('beforeunload', function() {
    var onPage = Math.round((Date.now() - startTime) / 1000);
    send({ e: 'exit', onPage: onPage, scrollMax: Math.min(maxScroll, 100), path: pagePath });
  });

  // Form submit tracking
  document.addEventListener('submit', function(e) {
    var form = e.target;
    var id = form.id || '';
    var action = form.action || '';
    var name = form.getAttribute('name') || '';
    send({ e: 'form_submit', id: id, action: action.slice(0, 200), name: name, path: pagePath });
  }, true);
})();`;

// ---- TRACK ENDPOINT ----
function handleTrack(req, res) {
  const data = req.body || {};
  const ev = data.e || 'unknown';
  const session = getOrCreateSession(req);
  
  const event = {
    sid: session.sid,
    e: ev,
    t: data.t || Date.now(),
    dt: data.dt || 0,
    device: session.device,
    browser: session.browser,
    os: session.os,
    ip: session.ip,
    data: data
  };
  
  store.events.push(event);
  if (store.events.length > 50000) store.events = store.events.slice(-30000);
  
  // Track clicks separately
  if (ev === 'click') {
    store.clicks.push({
      sid: session.sid,
      t: data.t || Date.now(),
      tag: data.tag || '',
      text: data.text || '',
      id: data.id || '',
      cls: data.cls || '',
      href: data.href || '',
      x: data.x || 0,
      y: data.y || 0,
      device: session.device,
      browser: session.browser
    });
    session.clicks++;
    if (store.clicks.length > 20000) store.clicks = store.clicks.slice(-10000);
  }
  
  // Track page views
  if (ev === 'pageview' && data.url) {
    try {
      const urlPath = new URL(data.url).pathname;
      if (!store.pageViews[urlPath]) store.pageViews[urlPath] = { views: 0, sessions: {}, totalTime: 0 };
      store.pageViews[urlPath].views++;
      store.pageViews[urlPath].sessions[session.sid] = (store.pageViews[urlPath].sessions[session.sid] || 0) + 1;
    } catch(e) {}
  }
  
  // Track scroll depth
  if (ev === 'scroll' && data.maxScroll) {
    if (data.maxScroll > session.scroll) session.scroll = data.maxScroll;
  }
  
  // Track exit
  if (ev === 'exit') {
    session.active = false;
    const timeOnSite = Math.round((Date.now() - session.firstVisit) / 1000);
    if (!session.totalTime) session.totalTime = 0;
    session.totalTime += timeOnSite;
  }
  
  // Save periodically
  if (store.events.length % 20 === 0) save();
  
  res.json({ ok: true });
}

// ---- ANALYTICS DATA ----
function getAnalytics() {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const sessions = Object.values(store.sessions);
  const activeSessions = sessions.filter(s => s.active && (now - s.lastActivity) < 300000);
  
  const todaySessions = sessions.filter(s => {
    const d = new Date(s.firstVisit).toISOString().slice(0, 10);
    return d === today;
  });
  
  const todayEvents = store.events.filter(e => {
    const d = new Date(e.t).toISOString().slice(0, 10);
    return d === today;
  });
  
  const sources = {};
  sessions.forEach(s => {
    const ref = s.ref || '';
    let src = 'Direto';
    if (ref.includes('instagram')) src = 'Instagram';
    else if (ref.includes('facebook') || ref.includes('fb')) src = 'Facebook';
    else if (ref.includes('google')) src = 'Google';
    else if (ref.includes('l.facebook.com')) src = 'Facebook';
    else if (ref.includes('whatsapp')) src = 'WhatsApp';
    else if (ref.includes('email') || ref.includes('mail')) src = 'Email';
    else if (ref.includes('meta')) src = 'Meta Ads';
    sources[src] = (sources[src] || 0) + 1;
  });
  
  const devices = { desktop: 0, mobile: 0, tablet: 0 };
  sessions.forEach(s => { if (devices[s.device] !== undefined) devices[s.device]++; });
  
  const browsers = {};
  sessions.forEach(s => { browsers[s.browser] = (browsers[s.browser] || 0) + 1; });
  
  const sessionsWithTime = sessions.filter(s => s.totalTime);
  const avgTime = sessionsWithTime.length > 0
    ? Math.round(sessionsWithTime.reduce((sum, s) => sum + s.totalTime, 0) / sessionsWithTime.length)
    : 0;
  
  const todayClicks = store.clicks.filter(c => {
    const d = new Date(c.t).toISOString().slice(0, 10);
    return d === today;
  });
  
  const topPages = Object.entries(store.pageViews)
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 20)
    .map(([url, data]) => ({ url, views: data.views, sessions: Object.keys(data.sessions).length }));
  
  const clickElements = {};
  store.clicks.slice(-1000).forEach(c => {
    const key = c.tag + ':' + (c.text || c.id || c.href || '?').slice(0, 40);
    clickElements[key] = clickElements[key] || { tag: c.tag, text: c.text, id: c.id, count: 0 };
    clickElements[key].count++;
  });
  const topClicks = Object.values(clickElements).sort((a, b) => b.count - a.count).slice(0, 20);
  
  const timeline = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const dayEvents = store.events.filter(e => new Date(e.t).toISOString().slice(0, 10) === dayStr);
    timeline[dayStr] = {
      pageviews: dayEvents.filter(e => e.e === 'pageview').length,
      clicks: dayEvents.filter(e => e.e === 'click').length,
      sessions: dayEvents.filter(e => e.e === 'pageview').length,
      scrolls: dayEvents.filter(e => e.e === 'scroll').length,
      exits: dayEvents.filter(e => e.e === 'exit').length
    };
  }
  
  const hourly = Array(24).fill(0);
  store.events.slice(-5000).forEach(e => {
    const h = new Date(e.t).getHours();
    hourly[h] = (hourly[h] || 0) + 1;
  });
  
  const funnelClicks = store.clicks.filter(c => {
    const text = (c.text + c.id + c.href).toLowerCase();
    return text.includes('assinar') || text.includes('comprar') || text.includes('pagar') || text.includes('checkout') || text.includes('finalizar');
  });
  
  return {
    sessions: { total: sessions.length, active: activeSessions.length, today: todaySessions.length, avgTime },
    events: { total: store.events.length, today: todayEvents.length },
    clicks: { total: store.clicks.length, today: todayClicks.length },
    sources,
    devices,
    browsers,
    topPages,
    topClicks,
    timeline,
    hourly,
    funnelClicks: funnelClicks.length,
    pageViews: store.pageViews
  };
}

// ---- DASHBOARD HTML ----
function renderDashboard(req, res) {
  const data = getAnalytics();
  
  function fmtNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function fmtTime(s) {
    if (!s || s <= 0) return '0s';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? m + 'm ' + sec + 's' : sec + 's';
  }
  
  const timelineDates = JSON.stringify(Object.keys(data.timeline));
  const timelineVisits = JSON.stringify(Object.values(data.timeline).map(d => d.pageviews));
  const timelineClicks = JSON.stringify(Object.values(data.timeline).map(d => d.clicks));
  const timelineScrolls = JSON.stringify(Object.values(data.timeline).map(d => d.scrolls));
  
  const sourceEntries = Object.entries(data.sources).sort((a,b) => b[1] - a[1]);
  const devEntries = Object.entries(data.devices).filter(([k,v]) => v > 0);
  const devTotal = devEntries.reduce((s, [,v]) => s + v, 0);
  const browserEntries = Object.entries(data.browsers).sort((a,b) => b[1] - a[1]);
  const browserTotal = browserEntries.reduce((s, [,v]) => s + v, 0);
  const hourlyJSON = JSON.stringify(data.hourly);
  
  const topPagesRows = data.topPages.slice(0, 8).map((p, i) => {
    return '<tr><td style="padding:8px 12px;color:#F0EDE4;font-size:13px;">' + p.url + '</td><td style="padding:8px 12px;color:#A7B7CC;font-size:13px;text-align:center;">' + fmtNum(p.views) + '</td><td style="padding:8px 12px;color:#A7B7CC;font-size:13px;text-align:center;">' + p.sessions + '</td></tr>';
  }).join('');
  
  const topClicksRows = data.topClicks.slice(0, 8).map(c =>
    '<tr><td style="padding:6px 12px;color:#F0EDE4;font-size:12px;"><span style="background:rgba(212,175,55,0.12);padding:2px 8px;border-radius:4px;font-size:10px;color:#D4AF37;">' + c.tag + '</span> ' + (c.text || c.id || '?').slice(0, 40) + '</td><td style="padding:6px 12px;color:#A7B7CC;font-size:13px;text-align:center;">' + c.count + '</td></tr>'
  ).join('');
  
  const sessionRows = Object.values(store.sessions).sort((a,b) => b.lastActivity - a.lastActivity).slice(0, 10).map(s => {
    const timeOnSite = s.totalTime ? fmtTime(s.totalTime) : 'Em andamento';
    const isActive = s.active && (Date.now() - s.lastActivity) < 300000;
    const lastActive = new Date(s.lastActivity).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    return '<tr><td style="padding:6px 10px;color:#A7B7CC;font-size:12px;">' + (isActive ? '<span style="color:#38D67A;">●</span>' : '<span style="color:#6B7A8D;">●</span>') + '</td><td style="padding:6px 10px;color:#F0EDE4;font-size:12px;">' + s.device + '</td><td style="padding:6px 10px;color:#A7B7CC;font-size:12px;">' + s.browser + '</td><td style="padding:6px 10px;color:#A7B7CC;font-size:12px;">' + s.clicks + '</td><td style="padding:6px 10px;color:#A7B7CC;font-size:12px;">' + timeOnSite + '</td><td style="padding:6px 10px;color:#6B7A8D;font-size:11px;">' + lastActive + '</td></tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:#6B7A8D;padding:24px;font-size:13px;">Nenhuma sessão registrada ainda.</td></tr>';

  const sourceRows = sourceEntries.map(([src, count]) => {
    const pct = (count * 100 / Math.max(Object.values(data.sources).reduce((a,b) => a+b, 0), 1)).toFixed(1);
    return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:13px;color:#F0EDE4;margin-bottom:4px;"><span>' + src + '</span><span style="color:#D4AF37;">' + count + ' (' + pct + '%)</span></div><div style="height:6px;background:rgba(255,255,255,0.04);border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#D4AF37,#E8C75A);border-radius:3px;"></div></div></div>';
  }).join('');

  const devRows = devEntries.map(([device, count]) => {
    const pct = devTotal > 0 ? (count * 100 / devTotal).toFixed(1) : 0;
    return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;color:#F0EDE4;"><span>' + device.charAt(0).toUpperCase() + device.slice(1) + '</span><span style="color:#D4AF37;">' + count + ' (' + pct + '%)</span></div>';
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Behavior Intelligence — Biblioteca Lumethos</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Libre+Baskerville:ital@0;1&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #07111D; font-family: 'Inter', -apple-system, sans-serif; color: #fff; min-height: 100vh; }
.main { max-width: 1400px; margin: 0 auto; padding: 24px 32px 60px; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 0 24px; border-bottom: 1px solid rgba(212,175,55,0.08); margin-bottom: 24px; }
.topbar h2 { font-size: 20px; font-weight: 600; color: #fff; font-family: 'Libre Baskerville', serif; }
.topbar h2 span { color: #D4AF37; }
.topbar .back-link { font-size: 13px; color: #6B7A8D; text-decoration: none; padding: 8px 16px; border: 1px solid rgba(212,175,55,0.15); border-radius: 8px; transition: all .2s; }
.topbar .back-link:hover { color: #D4AF37; border-color: rgba(212,175,55,0.35); }
.topbar .live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38D67A; margin-right: 6px; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 24px; }
.card { background: #0D1725; border: 1px solid rgba(212,175,55,0.12); border-radius: 18px; padding: 20px; transition: all .3s; }
.card:hover { border-color: rgba(212,175,55,0.25); box-shadow: 0 4px 20px rgba(212,175,55,0.04); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-header h3 { font-size: 11px; color: #6B7A8D; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
.card-header .icon { font-size: 20px; }
.card-value { font-size: 34px; font-weight: 700; color: #F0EDE4; letter-spacing: -0.5px; }
.card-value .unit { font-size: 14px; font-weight: 400; color: #6B7A8D; margin-left: 4px; }
.card-value.gold { color: #D4AF37; }
.chart-container { position: relative; height: 200px; width: 100%; }
.chart-container-sm { height: 120px; }
.section-title { font-size: 16px; font-weight: 600; color: #F0EDE4; margin: 24px 0 16px; font-family: 'Libre Baskerville', serif; }
.section-title span { color: #D4AF37; }
table { width: 100%; border-collapse: collapse; }
table th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6B7A8D; font-weight: 500; border-bottom: 1px solid rgba(212,175,55,0.08); }
table td { border-bottom: 1px solid rgba(255,255,255,0.03); }
.funnel-vis { display: flex; align-items: center; justify-content: center; gap: 20px; padding: 16px 0; }
.funnel-step { text-align: center; }
.funnel-step .value { font-size: 28px; font-weight: 700; color: #F0EDE4; }
.funnel-step .label { font-size: 11px; color: #6B7A8D; margin-top: 4px; }
.funnel-step .bar { height: 8px; border-radius: 4px; margin: 10px auto; background: linear-gradient(90deg,rgba(212,175,55,0.3),#D4AF37); }
.funnel-arrow { color: #D4AF37; font-size: 24px; opacity: 0.5; }
.insight-card { background: linear-gradient(135deg,rgba(212,175,55,0.04),rgba(56,214,122,0.04)); border: 1px solid rgba(212,175,55,0.15); border-radius: 18px; padding: 20px; }
.insight-card h3 { color: #D4AF37; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.insight-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(212,175,55,0.06); }
.insight-item:last-child { border: none; }
.insight-item .emoji { font-size: 18px; }
.insight-item p { font-size: 13px; color: #A7B7CC; line-height: 1.5; }
.insight-item strong { color: #F0EDE4; }
@media (max-width: 900px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-3 { grid-template-columns: 1fr; }
  .grid-2 { grid-template-columns: 1fr; }
  .main { padding: 16px; }
  .funnel-vis { flex-direction: column; gap: 12px; }
  .funnel-arrow { transform: rotate(90deg); }
}
</style>
</head>
<body>
<div class="main">
  <div class="topbar">
    <div>
      <h2>📊 Behavior <span>Intelligence</span></h2>
      <div style="font-size:12px;color:#6B7A8D;margin-top:4px;"><span class="live-dot"></span> Biblioteca Lumethos — Rastreamento de Navegação</div>
    </div>
    <div style="display:flex;gap:10px;">
      <span style="font-size:12px;color:#6B7A8D;padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:8px;">🔄 Auto-atualiza a cada 30s</span>
      <a href="/admin" class="back-link">← Voltar ao Admin</a>
    </div>
  </div>

  <!-- Mega Metrics -->
  <div class="grid-4">
    <div class="card">
      <div class="card-header"><h3>Sessões Hoje</h3><span class="icon">👤</span></div>
      <div class="card-value gold">${fmtNum(data.sessions.today)}</div>
      <div style="font-size:12px;color:#6B7A8D;margin-top:4px;">${fmtNum(data.sessions.total)} total</div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Visitantes Agora</h3><span class="icon">🟢</span></div>
      <div class="card-value">${fmtNum(data.sessions.active)}</div>
      <div style="font-size:12px;color:#6B7A8D;margin-top:4px;">nos últimos 5 min</div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Eventos Hoje</h3><span class="icon">⚡</span></div>
      <div class="card-value">${fmtNum(data.events.today)}</div>
      <div style="font-size:12px;color:#6B7A8D;margin-top:4px;">${fmtNum(data.events.total)} no total</div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Tempo Médio</h3><span class="icon">⏱️</span></div>
      <div class="card-value">${fmtTime(data.sessions.avgTime)}</div>
      <div style="font-size:12px;color:#6B7A8D;margin-top:4px;">por sessão</div>
    </div>
  </div>

  <!-- Funnel -->
  <div class="card" style="margin-bottom:24px;">
    <div class="card-header"><h3>Funil de Conversão</h3><span class="icon">🔁</span></div>
    <div class="funnel-vis">
      <div class="funnel-step"><div class="value">${fmtNum(data.sessions.total)}</div><div class="label">Sessões</div><div class="bar" style="width:100px;"></div></div>
      <div class="funnel-arrow">→</div>
      <div class="funnel-step"><div class="value">${fmtNum(data.events.total)}</div><div class="label">Eventos</div><div class="bar" style="width:80px;"></div></div>
      <div class="funnel-arrow">→</div>
      <div class="funnel-step"><div class="value">${fmtNum(data.clicks.total)}</div><div class="label">Cliques</div><div class="bar" style="width:60px;"></div></div>
      <div class="funnel-arrow">→</div>
      <div class="funnel-step"><div class="value">${fmtNum(data.funnelClicks)}</div><div class="label">Cliques em Compra</div><div class="bar" style="width:40px;"></div></div>
    </div>
  </div>

  <!-- Charts Row -->
  <div class="grid-3">
    <div class="card" style="grid-column: span 2;">
      <div class="card-header"><h3>Eventos — Últimos 30 Dias</h3><span class="icon">📈</span></div>
      <div class="chart-container">
        <canvas id="timelineChart"></canvas>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Distribuição Horária</h3><span class="icon">🕐</span></div>
      <div class="chart-container">
        <canvas id="hourlyChart"></canvas>
      </div>
    </div>
  </div>

  <!-- Sources + Devices -->
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3>Tráfego por Origem</h3><span class="icon">🌐</span></div>
      ${sourceRows}
    </div>
    <div class="card">
      <div class="card-header"><h3>Dispositivos</h3><span class="icon">📱</span></div>
      ${devRows}
      <div style="margin-top:16px;">
        <div class="card-header"><h3>Navegadores</h3></div>
        ${browserEntries.slice(0, 5).map(([b, count]) => {
          const pct = browserTotal > 0 ? (count * 100 / browserTotal).toFixed(1) : 0;
          return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:12px;color:#A7B7CC;"><span>' + b + '</span><span style="color:#D4AF37;">' + pct + '%</span></div>';
        }).join('')}
      </div>
    </div>
  </div>

  <!-- Top Pages + Clicks -->
  <div class="grid-2">
    <div class="card">
      <div class="card-header"><h3>Páginas Mais Visitadas</h3><span class="icon">📄</span></div>
      <table><thead><tr><th>Página</th><th style="text-align:center;">Views</th><th style="text-align:center;">Sessões</th></tr></thead><tbody>${topPagesRows}</tbody></table>
    </div>
    <div class="card">
      <div class="card-header"><h3>Elementos + Clicados</h3><span class="icon">👆</span></div>
      <table><thead><tr><th>Elemento</th><th style="text-align:center;">Cliques</th></tr></thead><tbody>${topClicksRows}</tbody></table>
    </div>
  </div>

  <!-- Insights + Sessions -->
  <div class="grid-2">
    <div class="insight-card">
      <h3>💡 Insights de Comportamento</h3>
      ${data.clicks.total > 0 ? '<div class="insight-item"><span class="emoji">👆</span><p><strong>' + fmtNum(data.clicks.total) + '</strong> cliques registrados. <strong>' + fmtNum(data.funnelClicks) + '</strong> em elementos de compra.' + (data.sessions.avgTime > 120 ? ' Tempo médio alto: visitantes engajados.' : ' Tempo médio baixo: otimizar retenção.') + '</p></div>' : ''}
      ${data.topPages.length > 0 ? '<div class="insight-item"><span class="emoji">📄</span><p>Página principal: <strong>' + data.topPages[0].url + '</strong> — ' + fmtNum(data.topPages[0].views) + ' visualizações.</p></div>' : ''}
      ${data.sessions.active > 0 ? '<div class="insight-item"><span class="emoji">🟢</span><p><strong>' + fmtNum(data.sessions.active) + '</strong> visitantes online agora.</p></div>' : '<div class="insight-item"><span class="emoji">💤</span><p>Nenhum visitante ativo no momento. Os dados continuam sendo coletados.</p></div>'}
      ${data.sources['Direto'] > 0 ? '<div class="insight-item"><span class="emoji">📊</span><p>Tráfego direto: <strong>' + fmtNum(data.sources['Direto']) + '</strong> sessões' + (data.sources['Direto'] > (data.sessions.total * 0.5) ? ' — maioria chega direto. Fortaleça campanhas.' : '.') + '</p></div>' : ''}
    </div>
    <div class="card">
      <div class="card-header"><h3>Sessões Recentes (ao vivo)</h3><span class="icon" style="color:#38D67A;">●</span></div>
      <table><thead><tr><th></th><th>Dispositivo</th><th>Navegador</th><th>Cliques</th><th>Tempo</th><th>Ativo</th></tr></thead><tbody>${sessionRows}</tbody></table>
    </div>
  </div>

  <div style="text-align:center;padding:24px 0;font-size:11px;color:#6B7A8D;">
    Biblioteca Lumethos — Behavior Intelligence v1.0 · Dados coletados via session tracking
  </div>
</div>

<script>
const timelineDates = ${timelineDates};
const timelineVisits = ${timelineVisits};
const timelineClicks = ${timelineClicks};
const hourlyData = ${hourlyJSON};

new Chart(document.getElementById('timelineChart'), {
  type: 'line', data: {
    labels: timelineDates.map(function(d) { var p = d.split('-'); return p[2] + '/' + p[1]; }),
    datasets: [
      { label: 'Pageviews', data: timelineVisits, borderColor: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.08)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 },
      { label: 'Cliques', data: timelineClicks, borderColor: '#38D67A', backgroundColor: 'rgba(56,214,122,0.08)', fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#6B7A8D', font: { size: 10 }, boxWidth: 12, padding: 12 } } },
    scales: { x: { ticks: { color: '#4A5A6A', font: { size: 9 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.03)' } }, y: { ticks: { color: '#4A5A6A', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } } },
    interaction: { intersect: false, mode: 'index' }
  }
});

new Chart(document.getElementById('hourlyChart'), {
  type: 'bar', data: {
    labels: Array.from({length:24},function(_,i) { return i + 'h'; }),
    datasets: [{ label: 'Eventos', data: hourlyData, backgroundColor: function(ctx) { var v = ctx.raw || 0; var max = Math.max.apply(null, hourlyData); var alpha = max > 0 ? 0.15 + (v / max) * 0.6 : 0.15; return 'rgba(212,175,55,' + alpha + ')'; }, borderColor: 'rgba(212,175,55,0.5)', borderWidth: 1, borderRadius: 3 }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { color: '#4A5A6A', font: { size: 8 } }, grid: { display: false } }, y: { ticks: { color: '#4A5A6A', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.03)' } } },
    interaction: { intersect: false, mode: 'index' }
  }
});

// Auto-refresh every 30s
setTimeout(function() { location.reload(); }, 30000);
</script>
</body>
</html>`;
  
  res.send(html);
}

// ---- API ENDPOINTS ----
function apiAnalytics(req, res) {
  res.json(getAnalytics());
}

function apiSessions(req, res) {
  const limit = parseInt(req.query.limit) || 50;
  const sessions = Object.values(store.sessions)
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, limit)
    .map(s => ({
      sid: s.sid.slice(0, 8) + '...',
      device: s.device,
      browser: s.browser,
      os: s.os,
      pages: s.pages?.length || 0,
      clicks: s.clicks,
      scroll: s.scroll,
      timeOnSite: s.totalTime || 0,
      lastActivity: s.lastActivity,
      active: s.active && (Date.now() - s.lastActivity) < 300000
    }));
  res.json({ sessions, total: Object.keys(store.sessions).length });
}

function apiEvents(req, res) {
  const limit = parseInt(req.query.limit) || 100;
  const type = req.query.type || '';
  let events = store.events;
  if (type) events = events.filter(e => e.e === type);
  res.json(events.slice(-limit).reverse());
}

function apiClicks(req, res) {
  const limit = parseInt(req.query.limit) || 100;
  res.json(store.clicks.slice(-limit));
}

function apiTopPages(req, res) {
  res.json(Object.entries(store.pageViews)
    .map(([url, data]) => ({ url, views: data.views, sessions: Object.keys(data.sessions).length }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20));
}

function serveTracker(req, res) {
  res.header('Content-Type', 'application/javascript');
  res.send(TRACKER_SCRIPT);
}

function exportCSV(type, res) {
  let data = [];
  let headers = [];
  
  if (type === 'events') {
    headers = ['Timestamp','Evento','Sessão','Dispositivo','Navegador','Intervalo(ms)'];
    data = store.events.slice(-5000).map(e => [
      new Date(e.t).toISOString(),
      e.e,
      e.sid.slice(0,8),
      e.device,
      e.browser,
      e.dt || 0
    ]);
  } else if (type === 'sessions') {
    headers = ['Sessão','Primeira Visita','Dispositivo','Navegador','OS','Cliques','Scroll','Tempo'];
    data = Object.values(store.sessions).map(s => [
      s.sid.slice(0,8),
      new Date(s.firstVisit).toISOString(),
      s.device, s.browser, s.os,
      s.clicks, s.scroll + '%',
      s.totalTime ? Math.round(s.totalTime / 60) + 'm' : '0m'
    ]);
  } else if (type === 'clicks') {
    headers = ['Timestamp','Tag','Texto','ID','Elemento','Dispositivo'];
    data = store.clicks.slice(-5000).map(c => [
      new Date(c.t).toISOString(),
      c.tag, c.text, c.id, c.href?.slice(0, 60) || '',
      c.device
    ]);
  }
  
  const csv = [headers.join(','), ...data.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\n');
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.header('Content-Disposition', 'attachment; filename="analytics_' + type + '_' + new Date().toISOString().slice(0,10) + '.csv"');
  res.send(csv);
}

module.exports = { init, handleTrack, serveTracker, renderDashboard, apiAnalytics, apiSessions, apiEvents, apiClicks, apiTopPages, exportCSV };
