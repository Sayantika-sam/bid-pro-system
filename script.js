/* ============================================================
   BidPro — Bid Management System
   Frontend-only application. All data is stored in localStorage.
   ============================================================ */
(() => {
  'use strict';

  /* ---------- Constants ---------- */
  const STORAGE_KEY = 'bidpro_state_v4';
  const SESSION_KEY = 'bidpro_session_v4';
  const THEME_KEY = 'bidpro_theme';
  const APP_VERSION = 4;
  const USER_ID = 1;

  const STATUS_META = {
    placed:    { label: 'Placed',    icon: 'fa-paper-plane',      className: 'status-placed' },
    winning:   { label: 'Winning',   icon: 'fa-trophy',           className: 'status-winning' },
    outbid:    { label: 'Outbid',    icon: 'fa-arrow-trend-down', className: 'status-outbid' },
    won:       { label: 'Won',       icon: 'fa-medal',            className: 'status-won' },
    lost:      { label: 'Lost',      icon: 'fa-xmark',            className: 'status-lost' },
    pending:   { label: 'Pending',   icon: 'fa-hourglass-half',   className: 'status-pending' },
    withdrawn: { label: 'Withdrawn', icon: 'fa-ban',              className: 'status-withdrawn' }
  };

  const TYPE_META = {
    manual:      { label: 'Manual',      icon: 'fa-hand-pointer' },
    auto:        { label: 'Auto',        icon: 'fa-robot' },
    incremental: { label: 'Incremental', icon: 'fa-arrow-trend-up' },
    max:         { label: 'Max bid',     icon: 'fa-arrow-up-long' },
    proxy:       { label: 'Proxy',       icon: 'fa-user-secret' }
  };

  const CATEGORY_ICONS = {
    Watches: 'fa-clock', Electronics: 'fa-laptop', Vehicles: 'fa-car',
    Art: 'fa-palette', Fashion: 'fa-bag-shopping', Furniture: 'fa-couch',
    Books: 'fa-book-open', Sports: 'fa-basketball'
  };

  const BIDDER_POOL = [
    { id: 2, name: 'Daniel Reed' },
    { id: 3, name: 'Sophia Chen' },
    { id: 4, name: 'Marcus Lee' },
    { id: 5, name: 'Priya Shah' },
    { id: 6, name: 'Ethan Cole' },
    { id: 7, name: 'Isabella Rossi' }
  ];

  const PAGE_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Your bidding command center' },
    'place-bid': { title: 'Place Bid', subtitle: 'Create a strategic new bid' },
    bids: { title: 'Bid Listing', subtitle: 'Search, filter and compare bids' },
    'bid-detail': { title: 'Bid Detail', subtitle: 'Auction context and bid timeline' },
    tracking: { title: 'Bid Tracking', subtitle: 'Real-time position monitoring' },
    history: { title: 'Bid History', subtitle: 'Your complete bidding audit trail' },
    'auto-bid': { title: 'Auto-Bid', subtitle: 'Automated bidding rules and limits' },
    analytics: { title: 'Analytics', subtitle: 'Bidding performance and patterns' },
    reports: { title: 'Reports', subtitle: 'Exportable bid intelligence' }
  };

  const PAGE_IDS = Object.keys(PAGE_META);

  /* ---------- Small utilities ---------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);
  const money = (value, decimals = 0) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: decimals, maximumFractionDigits: decimals
  }).format(Number(value) || 0);
  const moneyCompact = (value) => {
    const n = Number(value) || 0;
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace('.0', '') + 'm';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return '$' + Math.round(n);
  };
  const number = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0);
  const percent = (value) => `${Math.round(Number(value) || 0)}%`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const isoAgo = (ms) => new Date(Date.now() - ms).toISOString();
  const isoAhead = (ms) => new Date(Date.now() + ms).toISOString();
  const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
  const roundTo = (value, step = 1) => Math.round(value / step) * step;
  const plural = (count, singular, pluralWord = singular + 's') => `${count} ${count === 1 ? singular : pluralWord}`;

  function formatDateTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function formatDateShort(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function formatTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function timeAgo(value) {
    const diff = Math.max(0, Date.now() - new Date(value).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDateShort(value);
  }
  function countdownParts(value) {
    const diff = new Date(value).getTime() - Date.now();
    if (!Number.isFinite(diff) || diff <= 0) return { ended: true, text: 'Ended', urgent: false, diff: 0 };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    let text;
    if (days > 0) text = `${days}d ${hours}h`;
    else if (hours > 0) text = `${hours}h ${String(minutes).padStart(2, '0')}m`;
    else text = `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    return { ended: false, text, urgent: diff < 6 * 3600000, diff };
  }
  function dateInputValue(date) {
    const d = new Date(date);
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
  function csvEscape(value) {
    const str = String(value ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  }
  function downloadFile(filename, content, type = 'text/csv;charset=utf-8') {
    const blob = new Blob(['\ufeff' + content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function statusPill(status) {
    const meta = STATUS_META[status] || STATUS_META.placed;
    return `<span class="status-pill ${meta.className}"><i class="fa-solid ${meta.icon}"></i>${meta.label}</span>`;
  }
  function typeBadge(type) {
    const meta = TYPE_META[type] || TYPE_META.manual;
    return `<span class="type-badge ${type}"><i class="fa-solid ${meta.icon}"></i>${meta.label}</span>`;
  }
  function avatar(name, extra = '') {
    return `<span class="avatar ${extra}">${escapeHTML(initials(name))}</span>`;
  }

  /* ---------- Seed data ---------- */
  function seedState() {
    const H = 3600000;
    const D = 86400000;
    const now = Date.now();

    const auctions = [
      {
        id: 1, title: 'Vintage Rolex Datejust 36', category: 'Watches',
        description: 'A beautifully preserved 1987 Rolex Datejust in stainless steel with a champagne dial and jubilee bracelet. Recently serviced, with original box and papers.',
        image: 'assets/images/rolex.jpg', current_price: 7200, starting_price: 5000, min_increment: 100,
        end_date: new Date(now + 2 * H + 14 * 60000).toISOString(), status: 'active',
        seller: 'Heritage House', seller_rating: 4.9, location: 'New York, NY', condition: 'Excellent',
        watchers: 48, bid_count: 4, featured: true
      },
      {
        id: 2, title: 'MacBook Pro 16" M3 Max', category: 'Electronics',
        description: 'Apple MacBook Pro 16-inch with M3 Max chip, 48GB unified memory, and 1TB SSD. Sealed, unopened, and covered by AppleCare until 2028.',
        image: 'assets/images/macbook.jpg', current_price: 2850, starting_price: 2200, min_increment: 50,
        end_date: new Date(now + 6 * H + 40 * 60000).toISOString(), status: 'active',
        seller: 'TechVault', seller_rating: 4.8, location: 'Austin, TX', condition: 'New',
        watchers: 73, bid_count: 3, featured: false
      },
      {
        id: 3, title: '1967 Ford Mustang GT Fastback', category: 'Vehicles',
        description: 'Numbers-matching 1967 Mustang GT Fastback with a 390 V8, four-speed manual, and a comprehensive restoration completed in 2024.',
        image: 'assets/images/mustang.jpg', current_price: 48500, starting_price: 40000, min_increment: 500,
        end_date: new Date(now + D + 4 * H).toISOString(), status: 'active',
        seller: 'Motorclassics', seller_rating: 4.7, location: 'Scottsdale, AZ', condition: 'Restored',
        watchers: 124, bid_count: 3, featured: true
      },
      {
        id: 4, title: '“Emerald Tide” Abstract Canvas', category: 'Art',
        description: 'An original 48 × 60 inch mixed-media canvas by contemporary artist Maren Ellison. Signed, dated, and accompanied by a certificate of authenticity.',
        image: 'assets/images/art.jpg', current_price: 1240, starting_price: 800, min_increment: 50,
        end_date: new Date(now + 3 * H + 20 * 60000).toISOString(), status: 'active',
        seller: 'Atelier 9', seller_rating: 4.9, location: 'Los Angeles, CA', condition: 'New',
        watchers: 31, bid_count: 2, featured: false
      },
      {
        id: 5, title: 'Hermès Birkin 30 Togo', category: 'Fashion',
        description: 'Hermès Birkin 30 in Gold Togo leather with gold hardware. Includes rain cover, clochette, lock, keys, and original dust bag. Excellent pre-owned condition.',
        image: 'assets/images/bag.jpg', current_price: 9800, starting_price: 7500, min_increment: 250,
        end_date: new Date(now + 5 * H + 10 * 60000).toISOString(), status: 'active',
        seller: 'Maison Luxe', seller_rating: 4.8, location: 'Miami, FL', condition: 'Excellent',
        watchers: 96, bid_count: 3, featured: true
      },
      {
        id: 6, title: 'Sony Alpha 7 IV Camera Kit', category: 'Electronics',
        description: 'Sony A7 IV full-frame mirrorless camera with 28-70mm lens, two batteries, charger, and a 128GB CFexpress card. Low shutter count.',
        image: 'assets/images/camera.jpg', current_price: 2100, starting_price: 1700, min_increment: 75,
        end_date: new Date(now + 2 * D + 2 * H).toISOString(), status: 'active',
        seller: 'Lens & Light', seller_rating: 4.6, location: 'Seattle, WA', condition: 'Like new',
        watchers: 42, bid_count: 2, featured: false
      },
      {
        id: 7, title: 'Mid-Century Walnut Credenza', category: 'Furniture',
        description: 'Danish-inspired walnut credenza with sculpted pulls and tapered legs. Professionally refinished, with adjustable interior shelving.',
        image: 'assets/images/credenza.jpg', current_price: 1650, starting_price: 1200, min_increment: 100,
        end_date: new Date(now + D + 9 * H).toISOString(), status: 'active',
        seller: 'Form & Found', seller_rating: 4.7, location: 'Portland, OR', condition: 'Refinished',
        watchers: 27, bid_count: 2, featured: false
      },
      {
        id: 8, title: 'The Great Gatsby — First Edition', category: 'Books',
        description: 'A 1925 first edition, first printing of F. Scott Fitzgerald’s The Great Gatsby. Original green cloth boards with a custom clamshell case.',
        image: 'assets/images/gatsby.jpg', current_price: 4300, starting_price: 3500, min_increment: 100,
        end_date: new Date(now - 12 * D).toISOString(), status: 'ended',
        seller: 'Rare Shelf', seller_rating: 5.0, location: 'Boston, MA', condition: 'Very good',
        watchers: 58, bid_count: 3, featured: false
      },
      {
        id: 9, title: 'Vintage Omega Seamaster 300', category: 'Watches',
        description: 'A 1968 Omega Seamaster 300 with a tropical dial, original bezel, and Calibre 565 automatic movement. Serviced in 2025.',
        image: 'assets/images/omega.jpg', current_price: 3100, starting_price: 2400, min_increment: 100,
        end_date: new Date(now - 31 * D).toISOString(), status: 'ended',
        seller: 'Heritage House', seller_rating: 4.9, location: 'New York, NY', condition: 'Good',
        watchers: 67, bid_count: 3, featured: false
      },
      {
        id: 10, title: 'Signed 1996 Bulls Basketball Jersey', category: 'Sports',
        description: 'Chicago Bulls road jersey signed by Michael Jordan in silver marker, with a Beckett authentication certificate and tamper-evident hologram.',
        image: 'assets/images/jersey.jpg', current_price: 1875, starting_price: 1400, min_increment: 75,
        end_date: new Date(now - 58 * D).toISOString(), status: 'ended',
        seller: 'Legends Locker', seller_rating: 4.8, location: 'Chicago, IL', condition: 'Excellent',
        watchers: 84, bid_count: 2, featured: false
      },
      {
        id: 11, title: 'Leica M11 Rangefinder Camera', category: 'Electronics',
        description: 'Leica M11 in black chrome with a 60MP full-frame sensor, original packaging, and a spare battery. Lightly used with 2,100 actuations.',
        image: 'assets/images/camera.jpg', current_price: 3450, starting_price: 3000, min_increment: 75,
        end_date: new Date(now + 9 * H + 45 * 60000).toISOString(), status: 'active',
        seller: 'Lens & Light', seller_rating: 4.6, location: 'Seattle, WA', condition: 'Excellent',
        watchers: 36, bid_count: 1, featured: false
      }
    ];

    const bids = [
      { id: 1, auction_id: 1, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 7200, status: 'winning', timestamp: isoAgo(35 * 60000), bid_type: 'proxy', note: 'Final offer — do not exceed.' },
      { id: 2, auction_id: 1, bidder_id: 2, bidder_name: 'Daniel Reed', amount: 7100, status: 'outbid', timestamp: isoAgo(80 * 60000), bid_type: 'manual' },
      { id: 3, auction_id: 1, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 6800, status: 'outbid', timestamp: isoAgo(3 * H), bid_type: 'incremental' },
      { id: 4, auction_id: 1, bidder_id: 3, bidder_name: 'Sophia Chen', amount: 6500, status: 'outbid', timestamp: isoAgo(26 * H), bid_type: 'manual' },
      { id: 5, auction_id: 2, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 2850, status: 'winning', timestamp: isoAgo(20 * 60000), bid_type: 'max' },
      { id: 6, auction_id: 2, bidder_id: 4, bidder_name: 'Marcus Lee', amount: 2800, status: 'outbid', timestamp: isoAgo(2 * H), bid_type: 'manual' },
      { id: 7, auction_id: 2, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 2600, status: 'outbid', timestamp: isoAgo(28 * H), bid_type: 'auto' },
      { id: 8, auction_id: 3, bidder_id: 2, bidder_name: 'Daniel Reed', amount: 48500, status: 'winning', timestamp: isoAgo(45 * 60000), bid_type: 'manual' },
      { id: 9, auction_id: 3, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 47900, status: 'outbid', timestamp: isoAgo(3 * H + 10 * 60000), bid_type: 'auto' },
      { id: 10, auction_id: 3, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 46000, status: 'outbid', timestamp: isoAgo(2 * D + 3 * H), bid_type: 'manual' },
      { id: 11, auction_id: 4, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 1240, status: 'winning', timestamp: isoAgo(12 * 60000), bid_type: 'manual' },
      { id: 12, auction_id: 4, bidder_id: 5, bidder_name: 'Priya Shah', amount: 1190, status: 'outbid', timestamp: isoAgo(75 * 60000), bid_type: 'manual' },
      { id: 13, auction_id: 5, bidder_id: 3, bidder_name: 'Sophia Chen', amount: 9800, status: 'winning', timestamp: isoAgo(55 * 60000), bid_type: 'proxy' },
      { id: 14, auction_id: 5, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 9600, status: 'outbid', timestamp: isoAgo(2 * H), bid_type: 'max' },
      { id: 15, auction_id: 5, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 9100, status: 'outbid', timestamp: isoAgo(30 * H), bid_type: 'manual' },
      { id: 16, auction_id: 6, bidder_id: 4, bidder_name: 'Marcus Lee', amount: 2100, status: 'winning', timestamp: isoAgo(3 * H), bid_type: 'manual' },
      { id: 17, auction_id: 6, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 2050, status: 'pending', timestamp: isoAgo(4 * H), bid_type: 'auto' },
      { id: 18, auction_id: 7, bidder_id: 5, bidder_name: 'Priya Shah', amount: 1650, status: 'winning', timestamp: isoAgo(2 * H), bid_type: 'manual' },
      { id: 19, auction_id: 7, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 1600, status: 'outbid', timestamp: isoAgo(5 * H), bid_type: 'manual' },
      { id: 20, auction_id: 8, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 4300, status: 'won', timestamp: isoAgo(12 * D + 2 * H), bid_type: 'max' },
      { id: 21, auction_id: 8, bidder_id: 2, bidder_name: 'Daniel Reed', amount: 4200, status: 'lost', timestamp: isoAgo(12 * D + 3 * H), bid_type: 'manual' },
      { id: 22, auction_id: 8, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 4000, status: 'lost', timestamp: isoAgo(12 * D + 5 * H), bid_type: 'incremental' },
      { id: 23, auction_id: 9, bidder_id: 3, bidder_name: 'Sophia Chen', amount: 3100, status: 'won', timestamp: isoAgo(31 * D + 2 * H), bid_type: 'proxy' },
      { id: 24, auction_id: 9, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 2950, status: 'lost', timestamp: isoAgo(31 * D + 3 * H), bid_type: 'manual' },
      { id: 25, auction_id: 9, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 2800, status: 'lost', timestamp: isoAgo(31 * D + 5 * H), bid_type: 'auto' },
      { id: 26, auction_id: 10, bidder_id: 1, bidder_name: 'Alex Morgan', amount: 1875, status: 'won', timestamp: isoAgo(58 * D + 2 * H), bid_type: 'max' },
      { id: 27, auction_id: 10, bidder_id: 4, bidder_name: 'Marcus Lee', amount: 1800, status: 'lost', timestamp: isoAgo(58 * D + 4 * H), bid_type: 'manual' },
      { id: 28, auction_id: 11, bidder_id: 6, bidder_name: 'Ethan Cole', amount: 3450, status: 'placed', timestamp: isoAgo(8 * 60000), bid_type: 'manual' }
    ];

    const history = [];
    const previousByAuction = {};
    [...bids].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach((bid, index) => {
      history.push({
        id: index + 1,
        bid_id: bid.id,
        auction_id: bid.auction_id,
        previous_amount: previousByAuction[bid.auction_id] ?? null,
        new_amount: bid.amount,
        timestamp: bid.timestamp,
        change_type: bid.bid_type === 'auto' ? 'auto_bid' : 'placed'
      });
      previousByAuction[bid.auction_id] = bid.amount;
    });

    const autoBids = [
      { id: 1, user_id: USER_ID, auction_id: 3, max_amount: 52000, increment: 500, status: 'active', strategy: 'standard', created_at: isoAgo(4 * D) },
      { id: 2, user_id: USER_ID, auction_id: 5, max_amount: 10500, increment: 250, status: 'active', strategy: 'conservative', created_at: isoAgo(2 * D) },
      { id: 3, user_id: USER_ID, auction_id: 6, max_amount: 2400, increment: 75, status: 'paused', strategy: 'standard', created_at: isoAgo(1 * D) },
      { id: 4, user_id: USER_ID, auction_id: 9, max_amount: 3300, increment: 100, status: 'completed', strategy: 'standard', created_at: isoAgo(36 * D) }
    ];

    const notifications = [
      { id: 1, type: 'outbid', title: 'You’ve been outbid', message: 'Sophia Chen placed $9,800 on Hermès Birkin 30 Togo. Increase your bid to retake the lead.', time: isoAgo(55 * 60000), read: false, auction_id: 5, bid_id: 13 },
      { id: 2, type: 'win', title: 'You’re still winning', message: 'Your $7,200 bid leads the Vintage Rolex Datejust 36 auction.', time: isoAgo(35 * 60000), read: false, auction_id: 1, bid_id: 1 },
      { id: 3, type: 'auto', title: 'Auto-bid protected your lead', message: 'BidPro raised your bid to $48,000 on the 1967 Ford Mustang GT.', time: isoAgo(3 * H), read: false, auction_id: 3, bid_id: 9 },
      { id: 4, type: 'info', title: 'Auction ending soon', message: 'The Vintage Rolex Datejust 36 closes in under 3 hours. Review your maximum bid.', time: isoAgo(5 * H), read: true, auction_id: 1, bid_id: 1 }
    ];

    const savedReports = [
      { id: 1, type: 'bids', label: 'Bid activity report', from: dateInputValue(new Date(now - 30 * D)), to: dateInputValue(new Date(now)), generated_at: isoAgo(2 * D), rows: 18, format: 'CSV' },
      { id: 2, type: 'spending', label: 'Spending summary', from: dateInputValue(new Date(now - 90 * D)), to: dateInputValue(new Date(now)), generated_at: isoAgo(7 * D), rows: 11, format: 'PDF' }
    ];

    return {
      version: APP_VERSION,
      user: {
        id: USER_ID, name: 'Alex Morgan', email: 'alex@bidpro.demo', password: 'demo123',
        plan: 'Premium bidder', joined: '2025-08-12', phone: '+1 (415) 555-0138'
      },
      users: [{
        id: USER_ID, name: 'Alex Morgan', email: 'alex@bidpro.demo', password: 'demo123',
        plan: 'Premium bidder', joined: '2025-08-12', phone: '+1 (415) 555-0138'
      }],
      auctions,
      bids,
      history,
      autoBids,
      notifications,
      savedReports,
      trackedAuctions: [1, 3, 5, 8],
      settings: { autoBidEngine: true, simulation: true, notifications: true },
      nextBidId: 29,
      nextAutoBidId: 5,
      nextNotificationId: 5,
      nextReportId: 3
    };
  }

  /* ---------- State ---------- */
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== APP_VERSION) return seedState();
      return parsed;
    } catch (error) {
      console.warn('BidPro: could not load saved state.', error);
      return seedState();
    }
  }

  let state = loadState();
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch { session = null; }

  const ui = {
    currentPage: 'dashboard',
    selectedBidId: null,
    bidAuctionId: null,
    bidType: 'manual',
    bidFilters: { search: '', auction: '', status: '', type: '', sort: 'newest', myBidsOnly: false },
    bidPage: 1,
    bidPageSize: 8,
    selectedBidIds: new Set(),
    trackingFilter: 'all',
    historyFilters: { search: '', status: '', type: '', from: '', to: '' },
    dashboardRange: 7,
    analyticsRange: 30,
    reportFormat: 'csv',
    simulationTimer: null,
    countdownTimer: null,
    endingTimer: null,
    editingAutoBidId: null
  };

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn('BidPro: could not save state.', error); }
  }
  function currentUser() { return state.user; }
  function getUserByEmail(email) {
    return state.users.find(user => user.email.toLowerCase() === String(email).trim().toLowerCase());
  }
  function isLoggedIn() { return Boolean(session && session.email && getUserByEmail(session.email)); }

  /* ---------- Domain helpers ---------- */
  const getAuction = (id) => state.auctions.find(auction => auction.id === Number(id));
  const getBid = (id) => state.bids.find(bid => bid.id === Number(id));
  const activeAuctions = () => state.auctions.filter(auction => auction.status === 'active').sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  const userBids = () => state.bids.filter(bid => bid.bidder_id === currentUser().id);
  const sortedBids = (list = state.bids) => [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  function currentHighestBid(auctionId) {
    const valid = state.bids.filter(bid => bid.auction_id === Number(auctionId) && bid.status !== 'withdrawn');
    if (!valid.length) return null;
    return valid.reduce((best, bid) => {
      if (!best) return bid;
      if (bid.amount > best.amount) return bid;
      if (bid.amount === best.amount && new Date(bid.timestamp) > new Date(best.timestamp)) return bid;
      return best;
    }, null);
  }

  function userHighestBid(auctionId) {
    const valid = state.bids.filter(bid => bid.auction_id === Number(auctionId) && bid.bidder_id === currentUser().id && bid.status !== 'withdrawn');
    if (!valid.length) return null;
    return valid.reduce((best, bid) => (!best || bid.amount > best.amount ? bid : best), null);
  }

  function userPositions() {
    return activeAuctions().map(auction => {
      const bid = userHighestBid(auction.id);
      if (!bid) return null;
      const highest = currentHighestBid(auction.id);
      const isWinning = highest && highest.id === bid.id;
      return { auction, bid, highest, isWinning };
    }).filter(Boolean);
  }

  function closedUserBids() {
    return userBids().filter(bid => ['won', 'lost'].includes(bid.status));
  }

  function winRate() {
    const closed = closedUserBids();
    if (!closed.length) return 0;
    return (closed.filter(bid => bid.status === 'won').length / closed.length) * 100;
  }

  function resultForBid(bid) {
    if (!bid) return '—';
    if (bid.status === 'withdrawn') return 'Withdrawn';
    if (bid.status === 'won') return 'Winner';
    if (bid.status === 'lost') {
      const auctionBids = state.bids
        .filter(item => item.auction_id === bid.auction_id && item.status !== 'withdrawn')
        .sort((a, b) => b.amount - a.amount);
      const rank = auctionBids.findIndex(item => item.id === bid.id);
      return rank === 1 ? 'Runner Up' : 'Outbid';
    }
    if (bid.status === 'pending') return 'Pending';
    if (bid.status === 'winning' || bid.status === 'placed') return 'Ongoing';
    return 'Outbid';
  }

  function minNextBid(auction) {
    return Number(auction.current_price) + Number(auction.min_increment);
  }

  function activeAutoBidFor(auctionId) {
    return state.autoBids.find(rule => rule.auction_id === Number(auctionId) && rule.user_id === currentUser().id && rule.status === 'active');
  }

  function notifyUser({ type = 'info', title, message, auctionId = null, bidId = null }) {
    state.notifications.unshift({
      id: state.nextNotificationId++,
      type, title, message,
      time: new Date().toISOString(),
      read: false,
      auction_id: auctionId,
      bid_id: bidId
    });
    if (state.notifications.length > 40) state.notifications.length = 40;
  }

  function addHistoryEntry(bid, changeType = 'placed') {
    const previous = state.bids
      .filter(item => item.auction_id === bid.auction_id && item.id !== bid.id && item.status !== 'withdrawn' && new Date(item.timestamp) < new Date(bid.timestamp))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    state.history.push({
      id: state.history.reduce((max, item) => Math.max(max, item.id), 0) + 1,
      bid_id: bid.id,
      auction_id: bid.auction_id,
      previous_amount: previous ? previous.amount : null,
      new_amount: bid.amount,
      timestamp: bid.timestamp,
      change_type: changeType
    });
  }

  function markAuctionBids(auctionId, winnerId) {
    state.bids.forEach(bid => {
      if (bid.auction_id !== auctionId || bid.status === 'withdrawn') return;
      if (bid.id === winnerId) bid.status = 'won';
      else bid.status = 'lost';
    });
  }

  function finalizeEndedAuctions(silent = false) {
    let changed = false;
    const now = Date.now();
    state.auctions.forEach(auction => {
      if (auction.status !== 'active' || new Date(auction.end_date).getTime() > now) return;
      auction.status = 'ended';
      const highest = currentHighestBid(auction.id);
      if (highest) {
        markAuctionBids(auction.id, highest.id);
        auction.current_price = highest.amount;
        if (highest.bidder_id === currentUser().id) {
          notifyUser({
            type: 'win', title: 'Congratulations — you won!',
            message: `Your ${money(highest.amount)} bid won ${auction.title}.`,
            auctionId: auction.id, bidId: highest.id
          });
        } else {
          const userBid = userHighestBid(auction.id);
          if (userBid) {
            notifyUser({
              type: 'outbid', title: 'Auction closed',
              message: `${auction.title} ended. You did not win this time.`,
              auctionId: auction.id, bidId: userBid.id
            });
          }
        }
      }
      state.autoBids.forEach(rule => {
        if (rule.auction_id === auction.id && rule.status === 'active') rule.status = 'completed';
      });
      changed = true;
    });
    if (changed) {
      saveState();
      if (!silent && isLoggedIn()) {
        renderCurrentPage();
        renderNotifications();
        updateNavCounts();
      }
    }
    return changed;
  }

  /* ---------- Theme, toast, modal ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    $$('#themeToggle i, #authThemeToggle i').forEach(icon => {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
  }

  function toggleTheme() {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }

  function showToast(title, message = '', type = 'success') {
    const container = byId('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-check';
    toast.innerHTML = `
      <span class="toast-icon"><i class="fa-solid ${icon}"></i></span>
      <div class="toast-body"><strong>${escapeHTML(title)}</strong>${message ? `<p>${escapeHTML(message)}</p>` : ''}</div>
      <button class="toast-close" type="button" aria-label="Dismiss notification"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(toast);
    const dismiss = () => {
      toast.classList.add('leaving');
      setTimeout(() => toast.remove(), 260);
    };
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 4800);
  }

  function openModal({ title, eyebrow = 'BidPro', body = '', footer = '', wide = false }) {
    const backdrop = byId('modalBackdrop');
    const modal = byId('modal');
    byId('modalTitle').textContent = title;
    byId('modalEyebrow').textContent = eyebrow;
    byId('modalBody').innerHTML = body;
    byId('modalFooter').innerHTML = footer;
    modal.classList.toggle('modal-wide', wide);
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const focusable = modal.querySelector('input, select, textarea, button:not(#modalClose)');
      if (focusable) focusable.focus();
    }, 60);
  }

  function closeModal() {
    byId('modalBackdrop').hidden = true;
    document.body.style.overflow = '';
    byId('modalBody').innerHTML = '';
    byId('modalFooter').innerHTML = '';
  }

  function confirmAction({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm }) {
    openModal({
      title,
      eyebrow: danger ? 'Please confirm' : 'Confirm action',
      body: `<div class="confirm-copy"><div class="confirm-icon"><i class="fa-solid ${danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}"></i></div><p>${escapeHTML(message)}</p></div>`,
      footer: `<button class="btn btn-secondary" type="button" data-modal-cancel>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" id="confirmActionBtn">${escapeHTML(confirmLabel)}</button>`
    });
    byId('confirmActionBtn').addEventListener('click', () => {
      closeModal();
      onConfirm();
    });
  }

  /* ---------- Authentication ---------- */
  function setAuthMode(mode) {
    const login = mode === 'login';
    byId('loginTab').classList.toggle('active', login);
    byId('registerTab').classList.toggle('active', !login);
    byId('loginTab').setAttribute('aria-selected', String(login));
    byId('registerTab').setAttribute('aria-selected', String(!login));
    byId('loginForm').hidden = !login;
    byId('registerForm').hidden = login;
    byId('authTitle').textContent = login ? 'Sign in to your account' : 'Create your account';
    byId('authSubtitle').textContent = login ? 'Your next winning bid is waiting.' : 'Start tracking and winning in minutes.';
    byId('authMessage').hidden = true;
  }

  function showAuthMessage(message, success = false) {
    const element = byId('authMessage');
    element.textContent = message;
    element.classList.toggle('success', success);
    element.hidden = false;
  }

  function completeLogin(user) {
    session = { email: user.email, at: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    state.user = { ...user };
    saveState();
    byId('authScreen').hidden = true;
    byId('app').hidden = false;
    setUserChrome();
    startApp();
    showToast(`Welcome back, ${user.name.split(' ')[0]}`, 'Your auction workspace is ready.');
  }

  function setUserChrome() {
    const user = currentUser();
    $$('[data-user-name]').forEach(el => { el.textContent = user.name; });
    $$('[data-user-first]').forEach(el => { el.textContent = user.name.split(' ')[0]; });
    $$('[data-user-initials]').forEach(el => { el.textContent = initials(user.name); });
    $$('[data-user-email]').forEach(el => { el.textContent = user.email; });
    $$('[data-user-plan]').forEach(el => { el.textContent = user.plan; });
  }

  function login(email, password) {
    const user = getUserByEmail(email);
    if (!user || user.password !== password) {
      showAuthMessage('Email or password is incorrect. Try the demo credentials below.');
      return;
    }
    completeLogin(user);
  }

  function register(name, email, password, confirm) {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2) return showAuthMessage('Please enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return showAuthMessage('Please enter a valid email address.');
    if (password.length < 6) return showAuthMessage('Your password must be at least 6 characters.');
    if (password !== confirm) return showAuthMessage('The passwords do not match.');
    if (getUserByEmail(cleanEmail)) return showAuthMessage('An account with that email already exists. Try signing in.');
    if (!byId('registerTerms').checked) return showAuthMessage('Please agree to the terms of service to continue.');

    const newUser = {
      id: USER_ID, name: cleanName, email: cleanEmail, password,
      plan: 'Premium bidder', joined: new Date().toISOString().slice(0, 10), phone: ''
    };
    state.users.push(newUser);
    state.user = newUser;
    state.bids.forEach(bid => {
      if (bid.bidder_id === USER_ID) bid.bidder_name = cleanName;
    });
    saveState();
    completeLogin(newUser);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    session = null;
    byId('app').hidden = true;
    byId('authScreen').hidden = false;
    closeAllDropdowns();
    setAuthMode('login');
    byId('loginEmail').value = 'alex@bidpro.demo';
    byId('loginPassword').value = 'demo123';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- Navigation & routing ---------- */
  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || 'dashboard';
    const [pageRaw, queryRaw] = raw.split('?');
    const page = PAGE_IDS.includes(pageRaw) ? pageRaw : 'dashboard';
    return { page, params: new URLSearchParams(queryRaw || '') };
  }

  function navigate(page, params = null) {
    if (!PAGE_IDS.includes(page)) page = 'dashboard';
    let hash = `#${page}`;
    if (params) {
      const query = new URLSearchParams(params).toString();
      if (query) hash += `?${query}`;
    }
    if (location.hash === hash) handleRoute();
    else location.hash = hash;
  }

  function handleRoute() {
    if (!isLoggedIn()) {
      showAuth();
      return;
    }
    const { page, params } = parseRoute();
    if (page === 'bid-detail') {
      const requested = Number(params.get('id'));
      if (requested && getBid(requested)) ui.selectedBidId = requested;
      if (!ui.selectedBidId) {
        const latest = sortedBids(userBids())[0];
        ui.selectedBidId = latest ? latest.id : (sortedBids()[0] || {}).id || null;
      }
    }
    if (page === 'place-bid') {
      const auctionParam = Number(params.get('auction'));
      if (auctionParam && getAuction(auctionParam)?.status === 'active') ui.bidAuctionId = auctionParam;
    }
    if (page === 'bids' && params.has('search')) {
      ui.bidFilters.search = params.get('search') || '';
      ui.bidPage = 1;
    }
    ui.currentPage = page;
    $$('.page-section').forEach(section => { section.hidden = section.dataset.page !== page; });
    $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.nav === page));
    byId('pageTitle').textContent = PAGE_META[page].title;
    byId('pageSubtitle').textContent = PAGE_META[page].subtitle;
    closeSidebar();
    closeAllDropdowns();
    renderCurrentPage();
    renderNotifications();
    updateNavCounts();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderCurrentPage() {
    switch (ui.currentPage) {
      case 'dashboard': renderDashboard(); break;
      case 'place-bid': renderPlaceBidPage(); break;
      case 'bids': renderBidListing(); break;
      case 'bid-detail': renderBidDetail(); break;
      case 'tracking': renderTracking(); break;
      case 'history': renderHistory(); break;
      case 'auto-bid': renderAutoBid(); break;
      case 'analytics': renderAnalytics(); break;
      case 'reports': renderReports(); break;
      default: renderDashboard();
    }
    updateNavCounts();
    renderNotifications();
  }

  function updateNavCounts() {
    if (!isLoggedIn()) return;
    const positions = userPositions();
    byId('navBidCount').textContent = number(userBids().length);
    const outbid = positions.filter(position => !position.isWinning).length;
    const alert = byId('navOutbidCount');
    alert.hidden = outbid === 0;
    alert.title = `${outbid} outbid`;
    byId('autoBidNavState').textContent = state.settings.autoBidEngine ? 'ON' : 'OFF';
    byId('autoBidNavState').classList.toggle('off', !state.settings.autoBidEngine);
  }

  function closeSidebar() {
    byId('sidebar').classList.remove('open');
    byId('sidebarOverlay').classList.remove('open');
  }
  function openSidebar() {
    byId('sidebar').classList.add('open');
    byId('sidebarOverlay').classList.add('open');
  }
  function closeAllDropdowns() {
    $$('.dropdown-panel').forEach(panel => panel.classList.remove('open'));
    byId('notifBtn')?.setAttribute('aria-expanded', 'false');
    byId('profileBtn')?.setAttribute('aria-expanded', 'false');
  }

  /* ---------- App startup ---------- */
  function showAuth() {
    byId('app').hidden = true;
    byId('authScreen').hidden = false;
    setAuthMode('login');
  }

  function startApp() {
    if (!isLoggedIn()) { showAuth(); return; }
    const user = currentUser();
    setUserChrome();
    byId('todayDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const hour = new Date().getHours();
    byId('greetingTime').textContent = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    updateSimulationUI();
    if (!location.hash) history.replaceState(null, '', '#dashboard');
    handleRoute();
    startTimers();
  }

  function startTimers() {
    if (ui.countdownTimer) clearInterval(ui.countdownTimer);
    if (ui.endingTimer) clearInterval(ui.endingTimer);
    ui.countdownTimer = setInterval(updateCountdowns, 1000);
    ui.endingTimer = setInterval(() => finalizeEndedAuctions(false), 30000);
    startSimulation();
  }

  function updateCountdowns() {
    $$('[data-countdown]').forEach(element => {
      const parts = countdownParts(element.dataset.countdown);
      element.textContent = parts.text;
      element.classList.toggle('urgent', parts.urgent && !parts.ended);
      const wrapper = element.closest('[data-countdown-wrap]');
      if (wrapper) wrapper.classList.toggle('urgent', parts.urgent && !parts.ended);
    });
  }

  /* ---------- Chart helpers ---------- */
  function buildSeries(days, list = userBids()) {
    const now = Date.now();
    const start = now - days * 86400000;
    const bucketCount = days <= 7 ? 7 : days <= 30 ? 10 : 12;
    const bucketMs = (days * 86400000) / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      label: formatDateShort(new Date(start + (index + 1) * bucketMs)),
      value: 0
    }));
    list.forEach(bid => {
      const time = new Date(bid.timestamp).getTime();
      if (time < start) return;
      const index = clamp(Math.floor((time - start) / bucketMs), 0, bucketCount - 1);
      buckets[index].value += Number(bid.amount) || 0;
    });
    return buckets;
  }

  function renderLineChart(container, buckets, { id = 'chart', color = '#059669', height = 210 } = {}) {
    if (!container) return;
    if (!buckets.length) {
      container.innerHTML = '<div class="chart-empty"><i class="fa-solid fa-chart-line"></i>No activity in this period</div>';
      return;
    }
    const values = buckets.map(bucket => bucket.value);
    const max = Math.max(...values, 1);
    const width = 660;
    const heightValue = height;
    const pad = { left: 46, right: 16, top: 18, bottom: 28 };
    const plotW = width - pad.left - pad.right;
    const plotH = heightValue - pad.top - pad.bottom;
    const step = buckets.length > 1 ? plotW / (buckets.length - 1) : 0;
    const points = buckets.map((bucket, index) => ({
      x: pad.left + (buckets.length === 1 ? plotW / 2 : index * step),
      y: pad.top + plotH - (bucket.value / max) * plotH,
      ...bucket
    }));
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${pad.top + plotH} L ${points[0].x.toFixed(1)} ${pad.top + plotH} Z`;
    const gridLines = Array.from({ length: 5 }, (_, index) => {
      const y = pad.top + (plotH / 4) * index;
      const value = max - (max / 4) * index;
      return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" class="chart-grid-line"/>
        <text x="${pad.left - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-label">${moneyCompact(value)}</text>`;
    }).join('');
    const labelStep = buckets.length > 8 ? 2 : 1;
    const xLabels = points.map((point, index) => {
      if (index % labelStep !== 0 && index !== points.length - 1) return '';
      return `<text x="${point.x}" y="${heightValue - 7}" text-anchor="middle" class="chart-axis-label">${escapeHTML(point.label)}</text>`;
    }).join('');
    const dots = points.map(point => `
      <circle cx="${point.x}" cy="${point.y}" r="3.2" fill="#fff" stroke="${color}" stroke-width="2" class="chart-point">
        <title>${escapeHTML(point.label)}: ${money(point.value)}</title>
      </circle>`).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${heightValue}" role="img" aria-label="Bid value chart">
        <defs>
          <linearGradient id="${id}Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${color}" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaPath}" fill="url(#${id}Gradient)"/>
        <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
        ${xLabels}
      </svg>`;
  }

  function renderDonut(container, segments, totalLabel = 'bids') {
    if (!container) return;
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    if (!total) {
      container.innerHTML = '<div class="analytics-empty">No outcome data yet.</div>';
      return;
    }
    const radius = 58;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    const circles = segments.filter(segment => segment.value > 0).map(segment => {
      const dash = (segment.value / total) * circumference;
      const circle = `<circle cx="80" cy="80" r="${radius}" fill="none" stroke="${segment.color}" stroke-width="17"
        stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}" stroke-linecap="butt"
        transform="rotate(-90 80 80)"><title>${escapeHTML(segment.label)}: ${segment.value}</title></circle>`;
      offset += dash;
      return circle;
    }).join('');
    const legend = segments.map(segment => `
      <div class="donut-legend-item">
        <span class="legend-dot" style="background:${segment.color}"></span>
        <span>${escapeHTML(segment.label)}</span>
        <strong>${segment.value}</strong>
      </div>`).join('');
    container.innerHTML = `
      <svg class="donut-svg" viewBox="0 0 160 160" role="img" aria-label="Bid outcomes">
        <circle cx="80" cy="80" r="${radius}" fill="none" stroke="var(--surface-3)" stroke-width="17"></circle>
        ${circles}
        <text x="80" y="78" text-anchor="middle" class="donut-center-value">${total}</text>
        <text x="80" y="92" text-anchor="middle" class="donut-center-label">${escapeHTML(totalLabel)}</text>
      </svg>
      <div class="donut-legend">${legend}</div>`;
  }

  function statCard({ icon, tone = '', value, label, trend = '', trendClass = '', foot = '' }) {
    return `
      <article class="stat-card">
        <div class="stat-top">
          <span class="stat-icon ${tone}"><i class="fa-solid ${icon}"></i></span>
          ${trend ? `<span class="stat-trend ${trendClass}">${trend}</span>` : ''}
        </div>
        <div class="stat-value">${value}</div>
        <div class="stat-label">${escapeHTML(label)}</div>
        ${foot ? `<div class="stat-foot">${foot}</div>` : ''}
      </article>`;
  }

  function auctionPosition(auction) {
    const highest = currentHighestBid(auction.id);
    const userBid = userHighestBid(auction.id);
    if (!userBid) return { label: 'No bid yet', className: 'none', icon: 'fa-circle' };
    if (highest && highest.id === userBid.id) return { label: 'You’re winning', className: 'winning', icon: 'fa-trophy' };
    return { label: 'Outbid', className: 'outbid', icon: 'fa-arrow-trend-down' };
  }

  function auctionCardHTML(auction) {
    const position = auctionPosition(auction);
    const countdown = countdownParts(auction.end_date);
    return `
      <article class="auction-card">
        <div class="auction-image">
          <img src="${escapeHTML(auction.image)}" alt="${escapeHTML(auction.title)}" loading="lazy">
          <div class="auction-badges">
            <span class="auction-category">${escapeHTML(auction.category)}</span>
            ${statusPill(auction.status === 'active' ? 'winning' : 'ended').replace('Winning', auction.status === 'active' ? 'Live' : 'Ended')}
          </div>
          <div class="auction-countdown ${countdown.urgent ? 'urgent' : ''}"><i class="fa-regular fa-clock"></i><span data-countdown="${auction.end_date}">${countdown.text}</span></div>
        </div>
        <div class="auction-body">
          <h3 title="${escapeHTML(auction.title)}">${escapeHTML(auction.title)}</h3>
          <p class="auction-seller"><i class="fa-solid fa-location-dot"></i> ${escapeHTML(auction.location)}</p>
          <div class="auction-price-row">
            <div class="auction-price"><small>Current bid</small><strong>${money(auction.current_price)}</strong></div>
            <span class="auction-bid-count">${plural(auction.bid_count, 'bid')}</span>
          </div>
          <div class="auction-footer">
            <span class="auction-position ${position.className}"><i class="fa-solid ${position.icon}"></i>${position.label}</span>
            <button class="btn btn-secondary" type="button" data-place-auction="${auction.id}">Bid now <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        </div>
      </article>`;
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const positions = userPositions();
    const winning = positions.filter(position => position.isWinning).length;
    const outbid = positions.filter(position => !position.isWinning).length;
    const endingSoon = positions.filter(position => countdownParts(position.auction.end_date).diff < 6 * 3600000).length;
    const won = closedUserBids().filter(bid => bid.status === 'won');
    const lost = closedUserBids().filter(bid => bid.status === 'lost');
    const committed = positions.reduce((sum, position) => sum + position.bid.amount, 0);
    const wonValue = won.reduce((sum, bid) => sum + bid.amount, 0);
    const rate = winRate();

    byId('dashboardStats').innerHTML = [
      statCard({
        icon: 'fa-gavel', value: number(positions.length), label: 'Active bids',
        trend: `<i class="fa-solid fa-arrow-trend-up"></i> ${endingSoon} ending`, trendClass: endingSoon ? 'neutral' : '',
        foot: `<strong>${outbid}</strong> need attention · <strong>${winning}</strong> leading`
      }),
      statCard({
        icon: 'fa-trophy', tone: '', value: number(winning), label: 'Winning bids',
        trend: `${rate ? Math.round(rate) + '%' : '—'} win rate`,
        foot: `<strong>${money(committed)}</strong> currently committed`
      }),
      statCard({
        icon: 'fa-chart-simple', tone: 'blue', value: `${Math.round(rate)}%`, label: 'Historical win rate',
        trend: `<i class="fa-solid fa-medal"></i> ${won.length} won`,
        foot: `${won.length} wins · ${lost.length} losses from <strong>${won.length + lost.length}</strong> closed`
      }),
      statCard({
        icon: 'fa-sack-dollar', tone: 'purple', value: money(wonValue), label: 'Total won value',
        trend: `<i class="fa-solid fa-arrow-trend-up"></i> ${money(committed)} live`,
        foot: `Average winning bid <strong>${money(won.length ? wonValue / won.length : 0)}</strong>`
      })
    ].join('');

    renderDashboardChart();
    renderLiveFeed();
    byId('dashboardAuctions').innerHTML = activeAuctions().slice(0, 4).map(auctionCardHTML).join('') ||
      '<div class="card empty-state" style="grid-column:1/-1"><div class="empty-icon"><i class="fa-solid fa-gavel"></i></div><h3>No active auctions</h3><p>Check back soon for new opportunities.</p></div>';

    const recent = sortedBids(userBids()).slice(0, 5);
    byId('dashboardBids').innerHTML = recent.map(bid => {
      const auction = getAuction(bid.auction_id);
      if (!auction) return '';
      return `<tr>
        <td><span class="bid-id">#BP-${1000 + bid.id}</span></td>
        <td><div class="table-auction"><img class="table-thumb" src="${escapeHTML(auction.image)}" alt=""><div><strong>${escapeHTML(auction.title)}</strong><small>${escapeHTML(auction.category)}</small></div></div></td>
        <td><span class="money-cell">${money(bid.amount)}</span></td>
        <td>${typeBadge(bid.bid_type)}</td>
        <td>${statusPill(bid.status)}</td>
        <td><span title="${formatDateTime(bid.timestamp)}">${timeAgo(bid.timestamp)}</span></td>
        <td class="align-right"><button class="row-action-btn" type="button" data-open-bid="${bid.id}" aria-label="View bid details"><i class="fa-solid fa-arrow-right"></i></button></td>
      </tr>`;
    }).join('') || `<tr><td colspan="7"><div class="empty-state" style="padding:28px"><h3>No bids yet</h3><p>Place your first bid to get started.</p></div></td></tr>`;
  }

  function renderDashboardChart() {
    const buckets = buildSeries(ui.dashboardRange);
    const total = buckets.reduce((sum, bucket) => sum + bucket.value, 0);
    const mid = Math.floor(buckets.length / 2);
    const first = buckets.slice(0, mid).reduce((sum, bucket) => sum + bucket.value, 0);
    const second = buckets.slice(mid).reduce((sum, bucket) => sum + bucket.value, 0);
    const trend = first > 0 ? Math.round(((second - first) / first) * 100) : second > 0 ? 100 : 0;
    byId('chartTotalValue').textContent = money(total);
    const trendEl = byId('chartTrend');
    trendEl.innerHTML = `<i class="fa-solid ${trend >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${Math.abs(trend)}%`;
    trendEl.style.color = trend >= 0 ? 'var(--primary-600)' : 'var(--red)';
    trendEl.style.background = trend >= 0 ? 'var(--primary-soft)' : 'var(--red-soft)';
    renderLineChart(byId('dashboardSpendChart'), buckets, { id: 'dashboardSpend', height: 195 });
    $$('#spendRangeTabs button').forEach(button => button.classList.toggle('active', Number(button.dataset.range) === ui.dashboardRange));
  }

  function renderLiveFeed() {
    const latest = sortedBids().slice(0, 5);
    byId('liveFeed').innerHTML = latest.map(bid => {
      const auction = getAuction(bid.auction_id);
      const isYou = bid.bidder_id === currentUser().id;
      return `<div class="live-item" data-open-bid="${bid.id}" role="button" tabindex="0" style="cursor:pointer">
        ${avatar(bid.bidder_name)}
        <div class="live-item-main">
          <p><strong>${isYou ? 'You' : escapeHTML(bid.bidder_name)}</strong>${isYou ? '<span class="you-badge">YOU</span>' : ''} bid on ${escapeHTML(auction ? auction.title : 'an auction')}</p>
          <time>${timeAgo(bid.timestamp)} · ${escapeHTML((TYPE_META[bid.bid_type] || TYPE_META.manual).label)}</time>
        </div>
        <span class="live-amount">${money(bid.amount)}</span>
      </div>`;
    }).join('') || '<div class="chart-empty"><i class="fa-solid fa-satellite-dish"></i>No live activity yet</div>';
  }

  /* ---------- Place bid ---------- */
  function renderPlaceBidPage() {
    const auctions = activeAuctions();
    const select = byId('bidAuction');
    if (!auctions.length) {
      select.innerHTML = '<option value="">No active auctions</option>';
      byId('bidAuctionPreview').innerHTML = '<div class="empty-state" style="padding:20px"><p>There are no active auctions right now.</p></div>';
      byId('bidSummaryCard').innerHTML = '<div class="empty-state" style="padding:20px"><p>No auction selected.</p></div>';
      return;
    }
    if (!ui.bidAuctionId || !auctions.some(auction => auction.id === ui.bidAuctionId)) {
      ui.bidAuctionId = auctions[0].id;
    }
    select.innerHTML = auctions.map(auction => `<option value="${auction.id}">${escapeHTML(auction.title)} — ${money(auction.current_price)}</option>`).join('');
    select.value = String(ui.bidAuctionId);
    const amountInput = byId('bidAmount');
    if (!amountInput.value || amountInput.dataset.auction !== String(ui.bidAuctionId)) {
      amountInput.value = minNextBid(getAuction(ui.bidAuctionId));
      amountInput.dataset.auction = String(ui.bidAuctionId);
    }
    updateBidFormState();
    renderBidPulse();
  }

  function updateBidFormState() {
    const auction = getAuction(ui.bidAuctionId);
    if (!auction) return;
    const preview = byId('bidAuctionPreview');
    const countdown = countdownParts(auction.end_date);
    preview.innerHTML = `
      <img src="${escapeHTML(auction.image)}" alt="${escapeHTML(auction.title)}">
      <div class="auction-preview-main">
        <h4>${escapeHTML(auction.title)}</h4>
        <p><i class="fa-solid fa-store"></i> ${escapeHTML(auction.seller)} <span>·</span> <i class="fa-solid fa-location-dot"></i> ${escapeHTML(auction.location)}</p>
        <p><i class="fa-regular fa-clock"></i> <span data-countdown="${auction.end_date}">${countdown.text}</span> · ${plural(auction.bid_count, 'bid')}</p>
      </div>
      <div class="auction-preview-price"><small>Current bid</small><strong>${money(auction.current_price)}</strong><span>Min. next ${money(minNextBid(auction))}</span></div>`;

    byId('bidMinHint').textContent = `Minimum next bid: ${money(minNextBid(auction))} (current + ${money(auction.min_increment)} increment)`;
    const type = document.querySelector('input[name="bidType"]:checked')?.value || 'manual';
    ui.bidType = type;
    const conditional = byId('conditionalFields');
    conditional.hidden = type === 'manual';
    conditional.classList.toggle('single', type === 'incremental');
    byId('maxBidField').hidden = type === 'incremental';
    const maxInput = byId('bidMax');
    if (['auto', 'max', 'proxy'].includes(type) && !maxInput.value) {
      maxInput.value = Number(byId('bidAmount').value || minNextBid(auction)) + 500;
    }
    byId('bidIncrement').value = byId('bidIncrement').value || auction.min_increment;
    updateBidSummary();
  }

  function updateBidSummary() {
    const auction = getAuction(ui.bidAuctionId);
    if (!auction) return;
    const amount = Number(byId('bidAmount').value) || 0;
    const min = minNextBid(auction);
    const premium = amount * 0.05;
    const total = amount + premium;
    const type = document.querySelector('input[name="bidType"]:checked')?.value || 'manual';
    const max = Number(byId('bidMax').value) || 0;
    const valid = amount >= min;
    const rule = activeAutoBidFor(auction.id);
    let statusMessage;
    let statusClass = '';
    if (!valid) {
      statusMessage = `Increase your bid by at least ${money(min - amount)} to meet the minimum.`;
      statusClass = 'warn';
    } else if (['auto', 'max', 'proxy'].includes(type) && max && max < amount) {
      statusMessage = 'Your maximum limit must be at least your bid amount.';
      statusClass = 'warn';
    } else if (['auto', 'max', 'proxy'].includes(type) && max) {
      statusMessage = `Auto-bid protection active up to ${money(max)}.`;
    } else if (rule) {
      statusMessage = `You already have an auto-bid rule up to ${money(rule.max_amount)} on this auction.`;
    } else {
      statusMessage = 'Your bid meets the auction minimum and is ready to place.';
    }
    byId('bidSummaryCard').innerHTML = `
      <div class="summary-title"><h3>Bid summary</h3><span class="secure-chip"><i class="fa-solid fa-lock"></i> Secure</span></div>
      <div class="summary-auction">
        <img src="${escapeHTML(auction.image)}" alt="">
        <div><strong>${escapeHTML(auction.title)}</strong><small>${escapeHTML(auction.category)} · ends ${formatDateShort(auction.end_date)}</small></div>
      </div>
      <div class="summary-lines">
        <div class="summary-line"><span>Current bid</span><strong>${money(auction.current_price)}</strong></div>
        <div class="summary-line"><span>Minimum next bid</span><strong>${money(min)}</strong></div>
        <div class="summary-line"><span>Your bid</span><strong>${money(amount)}</strong></div>
        <div class="summary-line"><span>Buyer’s premium (5%)</span><strong>${money(premium)}</strong></div>
        <div class="summary-line"><span>Bid type</span><strong>${escapeHTML((TYPE_META[type] || TYPE_META.manual).label)}</strong></div>
        <div class="summary-line total"><span>Total if you win</span><strong>${money(total)}</strong></div>
      </div>
      <div class="summary-status ${statusClass}"><i class="fa-solid ${valid && !statusClass ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i><span>${escapeHTML(statusMessage)}</span></div>`;
  }

  function renderBidPulse() {
    const positions = userPositions();
    const winning = positions.filter(position => position.isWinning).length;
    const all = userBids();
    const rate = Math.round(winRate());
    byId('bidPulseStats').innerHTML = `
      <div class="pulse-row"><span>Active positions</span><strong>${positions.length}</strong></div>
      <div class="pulse-row"><span>Currently leading</span><strong>${winning}</strong></div>
      <div class="pulse-row"><span>Historical win rate</span><strong>${rate}%</strong></div>
      <div class="pulse-row"><span>Lifetime bids placed</span><strong>${all.length}</strong></div>`;
  }

  function setBidAuction(auctionId) {
    ui.bidAuctionId = Number(auctionId);
    byId('bidAuction').value = String(auctionId);
    const auction = getAuction(auctionId);
    const amountInput = byId('bidAmount');
    amountInput.value = auction ? minNextBid(auction) : '';
    amountInput.dataset.auction = String(auctionId);
    byId('bidIncrement').value = auction ? auction.min_increment : 100;
    byId('bidMax').value = '';
    updateBidFormState();
  }

  function validateBidForm() {
    const auction = getAuction(ui.bidAuctionId);
    if (!auction || auction.status !== 'active') {
      showToast('Auction unavailable', 'Please choose an active auction.', 'warning');
      return false;
    }
    if (countdownParts(auction.end_date).ended) {
      showToast('Auction closed', 'This auction has already ended.', 'warning');
      return false;
    }
    const amountInput = byId('bidAmount');
    const amount = Number(amountInput.value);
    const min = minNextBid(auction);
    amountInput.classList.remove('invalid');
    if (!Number.isFinite(amount) || amount < min) {
      amountInput.classList.add('invalid');
      showToast('Bid too low', `The minimum next bid is ${money(min)}.`, 'error');
      amountInput.focus();
      return false;
    }
    const type = document.querySelector('input[name="bidType"]:checked')?.value || 'manual';
    if (['auto', 'max', 'proxy'].includes(type)) {
      const max = Number(byId('bidMax').value);
      if (!Number.isFinite(max) || max < amount) {
        byId('bidMax').classList.add('invalid');
        showToast('Check your maximum', 'Your maximum bid must be at least your bid amount.', 'error');
        return false;
      }
      byId('bidMax').classList.remove('invalid');
    }
    if (!byId('bidTerms').checked) {
      showToast('Confirm the terms', 'Please accept the auction terms before placing your bid.', 'warning');
      return false;
    }
    return true;
  }

  function placeBid() {
    if (!validateBidForm()) return;
    const auction = getAuction(ui.bidAuctionId);
    const amount = Math.round(Number(byId('bidAmount').value));
    const type = document.querySelector('input[name="bidType"]:checked')?.value || 'manual';
    const max = Number(byId('bidMax').value) || 0;
    const increment = Number(byId('bidIncrement').value) || auction.min_increment;
    const previousHighest = currentHighestBid(auction.id);
    if (previousHighest && previousHighest.bidder_id === currentUser().id) {
      previousHighest.status = 'outbid';
    } else if (previousHighest) {
      previousHighest.status = 'outbid';
    }
    const bid = {
      id: state.nextBidId++,
      auction_id: auction.id,
      bidder_id: currentUser().id,
      bidder_name: currentUser().name,
      amount,
      status: 'winning',
      timestamp: new Date().toISOString(),
      bid_type: type,
      note: byId('bidNote').value.trim()
    };
    state.bids.push(bid);
    auction.current_price = amount;
    auction.bid_count = state.bids.filter(item => item.auction_id === auction.id && item.status !== 'withdrawn').length;
    addHistoryEntry(bid, type === 'auto' ? 'auto_bid' : 'placed');

    if (['auto', 'max', 'proxy'].includes(type) && max > amount) {
      const existing = state.autoBids.find(rule => rule.auction_id === auction.id && rule.user_id === currentUser().id && rule.status !== 'completed');
      if (existing) {
        existing.max_amount = max;
        existing.increment = increment;
        existing.status = 'active';
      } else {
        state.autoBids.push({
          id: state.nextAutoBidId++,
          user_id: currentUser().id,
          auction_id: auction.id,
          max_amount: max,
          increment,
          status: 'active',
          strategy: 'standard',
          created_at: new Date().toISOString()
        });
      }
    }
    saveState();
    byId('bidTerms').checked = false;
    byId('bidNote').value = '';
    showToast('Bid placed successfully', `${money(amount)} on ${auction.title}. You're currently winning.`);
    ui.selectedBidId = bid.id;
    navigate('bid-detail', { id: bid.id });
  }

  /* ---------- Bid listing ---------- */
  function populateBidFilterOptions() {
    const auctionSelect = byId('filterAuction');
    const current = ui.bidFilters.auction;
    auctionSelect.innerHTML = '<option value="">All auctions</option>' + state.auctions
      .map(auction => `<option value="${auction.id}">${escapeHTML(auction.title)}</option>`).join('');
    auctionSelect.value = current;
  }

  function syncBidFilterControls() {
    byId('bidSearch').value = ui.bidFilters.search;
    byId('filterAuction').value = ui.bidFilters.auction;
    byId('filterStatus').value = ui.bidFilters.status;
    byId('filterType').value = ui.bidFilters.type;
    byId('sortBids').value = ui.bidFilters.sort;
    byId('myBidsOnly').checked = ui.bidFilters.myBidsOnly;
  }

  function getFilteredBids() {
    const filters = ui.bidFilters;
    const query = filters.search.trim().toLowerCase();
    let list = state.bids.filter(bid => {
      if (filters.myBidsOnly && bid.bidder_id !== currentUser().id) return false;
      if (filters.auction && bid.auction_id !== Number(filters.auction)) return false;
      if (filters.status && bid.status !== filters.status) return false;
      if (filters.type && bid.bid_type !== filters.type) return false;
      if (query) {
        const auction = getAuction(bid.auction_id);
        const haystack = `${bid.bidder_name} ${auction ? auction.title : ''} BP-${1000 + bid.id} ${bid.id}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    const auctionEnd = (bid) => new Date(getAuction(bid.auction_id)?.end_date || 0).getTime();
    switch (filters.sort) {
      case 'oldest': list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)); break;
      case 'amount-high': list.sort((a, b) => b.amount - a.amount); break;
      case 'amount-low': list.sort((a, b) => a.amount - b.amount); break;
      case 'ending': list.sort((a, b) => auctionEnd(a) - auctionEnd(b)); break;
      default: list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return list;
  }

  function renderBidListing() {
    populateBidFilterOptions();
    syncBidFilterControls();
    const filtered = getFilteredBids();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ui.bidPageSize));
    ui.bidPage = clamp(ui.bidPage, 1, totalPages);
    const start = (ui.bidPage - 1) * ui.bidPageSize;
    const visible = filtered.slice(start, start + ui.bidPageSize);
    const winning = filtered.filter(bid => ['winning', 'placed'].includes(bid.status)).length;
    const value = filtered.reduce((sum, bid) => sum + bid.amount, 0);
    const avg = filtered.length ? value / filtered.length : 0;

    byId('bidListingStats').innerHTML = [
      statCard({ icon: 'fa-list-ul', value: number(filtered.length), label: 'Bids in view', foot: `<strong>${number(state.bids.length)}</strong> total bids in workspace` }),
      statCard({ icon: 'fa-trophy', tone: 'blue', value: number(winning), label: 'Leading / placed', foot: `<strong>${number(filtered.filter(bid => bid.status === 'outbid').length)}</strong> outbid bids` }),
      statCard({ icon: 'fa-sack-dollar', tone: 'purple', value: money(value), label: 'Total bid value', foot: `Across <strong>${plural(new Set(filtered.map(bid => bid.auction_id)).size, 'auction')}</strong>` }),
      statCard({ icon: 'fa-calculator', tone: 'amber', value: money(avg), label: 'Average bid', foot: `Highest <strong>${money(filtered.length ? Math.max(...filtered.map(bid => bid.amount)) : 0)}</strong>` })
    ].join('');

    byId('bidsTableBody').innerHTML = visible.map(bid => {
      const auction = getAuction(bid.auction_id);
      const isYou = bid.bidder_id === currentUser().id;
      const selected = ui.selectedBidIds.has(bid.id);
      return `<tr class="${selected ? 'bid-selected' : ''}">
        <td class="checkbox-col"><input type="checkbox" class="table-check" data-select-bid="${bid.id}" ${selected ? 'checked' : ''} aria-label="Select bid ${bid.id}"></td>
        <td><span class="bid-id">#BP-${1000 + bid.id}</span></td>
        <td><div class="table-auction"><img class="table-thumb" src="${escapeHTML(auction ? auction.image : '')}" alt=""><div><strong>${escapeHTML(auction ? auction.title : 'Unknown auction')}</strong><small>${escapeHTML(auction ? auction.category : '')}</small></div></div></td>
        <td><div class="bidder-cell">${avatar(bid.bidder_name)}<span>${isYou ? 'You' : escapeHTML(bid.bidder_name)}</span></div></td>
        <td><span class="money-cell">${money(bid.amount)}</span></td>
        <td>${typeBadge(bid.bid_type)}</td>
        <td>${statusPill(bid.status)}</td>
        <td><span title="${formatDateTime(bid.timestamp)}">${timeAgo(bid.timestamp)}</span></td>
        <td class="align-right"><div class="row-actions"><button class="row-action-btn" type="button" data-open-bid="${bid.id}" aria-label="View bid detail"><i class="fa-solid fa-eye"></i></button><button class="row-action-btn" type="button" data-place-auction="${bid.auction_id}" aria-label="Bid again"><i class="fa-solid fa-gavel"></i></button></div></td>
      </tr>`;
    }).join('');

    byId('bidsEmpty').hidden = filtered.length > 0;
    byId('bidResultCount').textContent = `Showing ${filtered.length ? start + 1 : 0}–${Math.min(start + ui.bidPageSize, filtered.length)} of ${filtered.length} bids`;
    byId('bidPageInfo').textContent = `Page ${ui.bidPage} of ${totalPages}`;
    byId('selectAllBids').checked = visible.length > 0 && visible.every(bid => ui.selectedBidIds.has(bid.id));
    byId('selectAllBids').indeterminate = visible.some(bid => ui.selectedBidIds.has(bid.id)) && !visible.every(bid => ui.selectedBidIds.has(bid.id));
    byId('bidsPagination').innerHTML = `
      <button type="button" data-bid-page="${ui.bidPage - 1}" ${ui.bidPage <= 1 ? 'disabled' : ''} aria-label="Previous page"><i class="fa-solid fa-chevron-left"></i></button>
      ${Array.from({ length: totalPages }, (_, index) => index + 1).map(page => `<button type="button" data-bid-page="${page}" class="${page === ui.bidPage ? 'active' : ''}">${page}</button>`).join('')}
      <button type="button" data-bid-page="${ui.bidPage + 1}" ${ui.bidPage >= totalPages ? 'disabled' : ''} aria-label="Next page"><i class="fa-solid fa-chevron-right"></i></button>`;
    updateCompareUI();
  }

  function updateCompareUI() {
    byId('compareCount').textContent = ui.selectedBidIds.size;
    byId('compareBidsBtn').disabled = ui.selectedBidIds.size < 2 || ui.selectedBidIds.size > 4;
    byId('compareBidsBtn').title = ui.selectedBidIds.size > 4 ? 'Select up to 4 bids to compare' : '';
  }

  function openCompareModal() {
    const bids = [...ui.selectedBidIds].map(getBid).filter(Boolean);
    if (bids.length < 2) {
      showToast('Select bids to compare', 'Choose at least two bids from the table.', 'warning');
      return;
    }
    if (bids.length > 4) {
      showToast('Too many bids selected', 'You can compare up to four bids at once.', 'warning');
      return;
    }
    const maxAmount = Math.max(...bids.map(bid => bid.amount));
    const rows = [
      ['Auction', ...bids.map(bid => {
        const auction = getAuction(bid.auction_id);
        return `<div class="compare-auction-cell"><img src="${escapeHTML(auction?.image || '')}" alt=""><span>${escapeHTML(auction?.title || '—')}</span></div>`;
      })],
      ['Bidder', ...bids.map(bid => escapeHTML(bid.bidder_id === currentUser().id ? 'You' : bid.bidder_name))],
      ['Amount', ...bids.map(bid => `<span class="${bid.amount === maxAmount ? 'compare-best' : ''}">${money(bid.amount)}</span>`)],
      ['Type', ...bids.map(bid => typeBadge(bid.bid_type))],
      ['Status', ...bids.map(bid => statusPill(bid.status))],
      ['Result', ...bids.map(bid => escapeHTML(resultForBid(bid)))],
      ['Placed', ...bids.map(bid => `<span title="${formatDateTime(bid.timestamp)}">${formatDateShort(bid.timestamp)}</span>`)]
    ];
    openModal({
      title: 'Compare bids',
      eyebrow: 'Side-by-side analysis',
      wide: true,
      body: `<div class="table-responsive"><table class="compare-table"><thead><tr><th>Attribute</th>${bids.map(bid => `<th>#BP-${1000 + bid.id}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr><td>${row[0]}</td>${row.slice(1).map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
      footer: `<button class="btn btn-secondary" type="button" id="clearCompareSelection">Clear selection</button><button class="btn btn-primary" type="button" data-modal-close>Done</button>`
    });
    byId('clearCompareSelection')?.addEventListener('click', () => {
      ui.selectedBidIds.clear();
      closeModal();
      renderBidListing();
    });
  }

  function exportBidsCSV() {
    const bids = getFilteredBids();
    if (!bids.length) {
      showToast('Nothing to export', 'No bids match the current filters.', 'warning');
      return;
    }
    const header = ['Bid ID', 'Auction', 'Category', 'Bidder', 'Amount', 'Type', 'Status', 'Result', 'Placed At'];
    const rows = bids.map(bid => {
      const auction = getAuction(bid.auction_id);
      return [
        `BP-${1000 + bid.id}`, auction?.title || '', auction?.category || '', bid.bidder_name,
        bid.amount, (TYPE_META[bid.bid_type] || TYPE_META.manual).label, STATUS_META[bid.status]?.label || bid.status,
        resultForBid(bid), formatDateTime(bid.timestamp)
      ];
    });
    const csv = [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n');
    downloadFile('bidpro-bid-listing.csv', csv);
    showToast('Bid listing exported', `${plural(bids.length, 'bid')} saved as CSV.`);
  }

  /* ---------- Bid detail ---------- */
  function renderBidDetail() {
    let bid = getBid(ui.selectedBidId);
    if (!bid) {
      bid = sortedBids(userBids())[0] || sortedBids()[0];
      if (bid) ui.selectedBidId = bid.id;
    }
    const container = byId('bidDetailContent');
    const actions = byId('bidDetailActions');
    if (!bid) {
      actions.innerHTML = '';
      container.innerHTML = `<div class="card bid-detail-empty"><div class="empty-icon"><i class="fa-solid fa-file-invoice"></i></div><h3>No bid selected</h3><p>Choose a bid from the listing to see its full detail.</p><button class="btn btn-primary" type="button" data-nav="bids">Browse bids</button></div>`;
      return;
    }
    const auction = getAuction(bid.auction_id);
    if (!auction) {
      container.innerHTML = '<div class="card bid-detail-empty"><h3>Auction unavailable</h3></div>';
      return;
    }
    const highest = currentHighestBid(auction.id);
    const isHighest = highest && highest.id === bid.id;
    const isYou = bid.bidder_id === currentUser().id;
    const auctionBids = state.bids.filter(item => item.auction_id === auction.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const position = isHighest ? 'winning' : bid.status === 'won' ? 'winning' : bid.status === 'lost' ? 'lost' : 'outbid';
    const countdown = countdownParts(auction.end_date);
    const tracked = state.trackedAuctions.includes(auction.id);
    const rule = activeAutoBidFor(auction.id);

    actions.innerHTML = `
      <button class="btn btn-secondary" type="button" data-nav="tracking"><i class="fa-solid fa-satellite-dish"></i> Track bids</button>
      ${auction.status === 'active' ? `<button class="btn btn-primary" type="button" data-place-auction="${auction.id}"><i class="fa-solid fa-gavel"></i> Place another bid</button>` : ''}`;

    const timeline = auctionBids.map(item => {
      const itemHighest = highest && item.id === highest.id;
      return `<div class="bid-timeline-item ${item.bidder_id === currentUser().id ? 'you' : ''} ${itemHighest ? 'current' : ''}">
        <span class="timeline-dot"><i class="fa-solid ${itemHighest ? 'fa-crown' : item.bidder_id === currentUser().id ? 'fa-user' : 'fa-gavel'}"></i></span>
        <div class="timeline-body">
          <div class="timeline-body-top">
            <strong>${item.bidder_id === currentUser().id ? 'You' : escapeHTML(item.bidder_name)}</strong>
            <span class="timeline-amount">${money(item.amount)}</span>
          </div>
          <p>${escapeHTML((TYPE_META[item.bid_type] || TYPE_META.manual).label)} bid · ${statusPill(item.status)}</p>
          <time>${formatDateTime(item.timestamp)} · ${timeAgo(item.timestamp)}</time>
        </div>
      </div>`;
    }).join('');

    container.innerHTML = `
      <div class="bid-detail-grid">
        <div class="bid-detail-main">
          <article class="card detail-hero">
            <div class="detail-hero-banner">
              <img src="${escapeHTML(auction.image)}" alt="${escapeHTML(auction.title)}">
              <div class="auction-badges">
                <span class="auction-category">${escapeHTML(auction.category)}</span>
                ${statusPill(auction.status === 'active' ? 'winning' : 'ended').replace('Winning', auction.status === 'active' ? 'Live auction' : 'Auction ended')}
              </div>
              <div class="detail-hero-copy">
                <h2>${escapeHTML(auction.title)}</h2>
                <p><span><i class="fa-solid fa-store"></i>${escapeHTML(auction.seller)}</span><span><i class="fa-solid fa-location-dot"></i>${escapeHTML(auction.location)}</span><span><i class="fa-solid fa-eye"></i>${auction.watchers} watching</span></p>
              </div>
            </div>
            <div class="detail-hero-body">
              <div class="detail-current"><small>Current auction price</small><strong>${money(auction.current_price)}</strong><span>${plural(auction.bid_count, 'bid')}</span></div>
              <div class="detail-timer"><small>${auction.status === 'active' ? 'Time remaining' : 'Auction closed'}</small><strong>${auction.status === 'active' ? `<span data-countdown="${auction.end_date}">${countdown.text}</span>` : formatDate(auction.end_date)}</strong></div>
            </div>
          </article>

          <article class="card detail-bid-card">
            <div class="detail-bid-top">
              <div><small>Bid amount · #BP-${1000 + bid.id}</small><strong>${money(bid.amount)}</strong></div>
              ${statusPill(bid.status)}
            </div>
            <div class="detail-meta-grid">
              <div class="detail-meta"><small>Bid type</small><strong>${escapeHTML((TYPE_META[bid.bid_type] || TYPE_META.manual).label)}</strong></div>
              <div class="detail-meta"><small>Result</small><strong>${escapeHTML(resultForBid(bid))}</strong></div>
              <div class="detail-meta"><small>Bidder</small><strong>${isYou ? 'You' : escapeHTML(bid.bidder_name)}</strong></div>
              <div class="detail-meta"><small>Placed</small><strong>${formatDateShort(bid.timestamp)}</strong></div>
            </div>
            <div class="detail-position ${position}">
              <span class="position-icon"><i class="fa-solid ${isHighest ? 'fa-trophy' : position === 'lost' ? 'fa-xmark' : 'fa-arrow-trend-down'}"></i></span>
              <span>${isHighest ? `<strong>You are the highest bidder.</strong> Your position is protected by the current leading bid.` : position === 'lost' ? `<strong>This auction has closed.</strong> ${resultForBid(bid)}.` : `<strong>You are not currently leading.</strong> Increase your bid to ${money(minNextBid(auction))} to retake the lead.`}</span>
            </div>
          </article>

          <article class="card">
            <div class="card-head"><div><h3>Auction bid timeline</h3><p>Every bid placed on this auction, newest first.</p></div><span class="rule-count">${plural(auctionBids.length, 'bid')}</span></div>
            <div class="bid-timeline">${timeline}</div>
          </article>
        </div>

        <aside class="bid-detail-side">
          <article class="card detail-side-card">
            <div class="card-head"><div><h3>Auction snapshot</h3><p>${escapeHTML(auction.condition)} condition</p></div></div>
            <img class="side-auction-thumb" src="${escapeHTML(auction.image)}" alt="">
            <div class="side-price-row"><span>Current bid</span><strong>${money(auction.current_price)}</strong></div>
            <div class="side-price-row"><span>Minimum next bid</span><strong>${money(minNextBid(auction))}</strong></div>
            <div class="side-price-row"><span>Bid increment</span><strong>${money(auction.min_increment)}</strong></div>
            <div class="side-price-row"><span>Ends</span><strong>${formatDate(auction.end_date)}</strong></div>
            <div class="side-price-row"><span>Your max protection</span><strong>${rule ? money(rule.max_amount) : 'Not set'}</strong></div>
            <div class="side-actions">
              ${auction.status === 'active' ? `<button class="btn btn-primary" type="button" data-place-auction="${auction.id}"><i class="fa-solid fa-gavel"></i> Increase my bid</button>` : ''}
              ${isYou && auction.status === 'active' && bid.status !== 'withdrawn' ? `<button class="btn btn-secondary" type="button" data-withdraw-bid="${bid.id}"><i class="fa-solid fa-ban"></i> Withdraw bid</button>` : ''}
            </div>
            <div class="track-toggle-row"><span><i class="fa-regular fa-bell"></i> Track this auction</span><button class="track-bell ${tracked ? 'active' : ''}" type="button" data-track-auction="${auction.id}" aria-label="Toggle auction tracking"><i class="fa-solid ${tracked ? 'fa-bell' : 'fa-bell-slash'}"></i></button></div>
          </article>

          <article class="card detail-side-card">
            <div class="card-head"><div><h3>Seller</h3><p>Verified auction partner</p></div><span class="secure-chip"><i class="fa-solid fa-circle-check"></i> Verified</span></div>
            <div class="seller-row"><span class="seller-avatar"><i class="fa-solid fa-store"></i></span><div><strong>${escapeHTML(auction.seller)}</strong><small>${escapeHTML(auction.location)}</small></div><span class="seller-rating"><i class="fa-solid fa-star"></i> ${auction.seller_rating}</span></div>
            <p style="font-size:.62rem;color:var(--muted);line-height:1.55;margin-top:6px">${escapeHTML(auction.description)}</p>
          </article>

          <article class="card detail-side-card">
            <div class="card-head"><div><h3>Bid metadata</h3><p>Reference and audit information.</p></div></div>
            <div class="side-price-row"><span>Reference</span><strong>#BP-${1000 + bid.id}</strong></div>
            <div class="side-price-row"><span>Timestamp</span><strong>${formatTime(bid.timestamp)}</strong></div>
            <div class="side-price-row"><span>Tracking</span><strong>${tracked ? 'Enabled' : 'Disabled'}</strong></div>
            ${bid.note ? `<div class="modal-note" style="margin-top:10px"><i class="fa-solid fa-note-sticky"></i><span>${escapeHTML(bid.note)}</span></div>` : ''}
          </article>
        </aside>
      </div>`;
  }

  function withdrawBid(bidId) {
    const bid = getBid(bidId);
    if (!bid) return;
    const auction = getAuction(bid.auction_id);
    if (!auction || auction.status !== 'active') {
      showToast('Cannot withdraw', 'This auction has already closed.', 'warning');
      return;
    }
    confirmAction({
      title: 'Withdraw this bid?',
      message: `Your ${money(bid.amount)} bid on ${auction.title} will be removed from the leading position. This cannot be undone.`,
      confirmLabel: 'Withdraw bid',
      danger: true,
      onConfirm: () => {
        const wasHighest = currentHighestBid(auction.id)?.id === bid.id;
        bid.status = 'withdrawn';
        if (wasHighest) {
          const remaining = state.bids
            .filter(item => item.auction_id === auction.id && item.status !== 'withdrawn' && item.id !== bid.id)
            .sort((a, b) => b.amount - a.amount)[0];
          if (remaining) {
            remaining.status = 'winning';
            auction.current_price = remaining.amount;
          } else {
            auction.current_price = auction.starting_price;
          }
        }
        state.history.push({
          id: state.history.reduce((max, item) => Math.max(max, item.id), 0) + 1,
          bid_id: bid.id, auction_id: auction.id, previous_amount: bid.amount, new_amount: null,
          timestamp: new Date().toISOString(), change_type: 'withdrawn'
        });
        notifyUser({ type: 'info', title: 'Bid withdrawn', message: `Your bid on ${auction.title} was withdrawn.`, auctionId: auction.id, bidId: bid.id });
        saveState();
        renderCurrentPage();
        renderNotifications();
        updateNavCounts();
        showToast('Bid withdrawn', 'Your bid has been removed from the auction.', 'warning');
      }
    });
  }

  /* ---------- Tracking ---------- */
  function renderTracking() {
    const positions = userPositions().sort((a, b) => new Date(a.auction.end_date) - new Date(b.auction.end_date));
    const winning = positions.filter(position => position.isWinning);
    const outbid = positions.filter(position => !position.isWinning);
    const ending = positions.filter(position => countdownParts(position.auction.end_date).diff < 6 * 3600000);
    const protectedCount = positions.filter(position => activeAutoBidFor(position.auction.id)).length;

    byId('trackingStats').innerHTML = [
      statCard({ icon: 'fa-trophy', value: number(winning.length), label: 'Auction positions leading', foot: `Across <strong>${plural(positions.length, 'tracked auction')}</strong>` }),
      statCard({ icon: 'fa-arrow-trend-down', tone: 'amber', value: number(outbid.length), label: 'Need attention', foot: `<strong>${money(outbid.reduce((sum, position) => sum + Math.max(0, minNextBid(position.auction) - position.bid.amount), 0))}</strong> to retake leads` }),
      statCard({ icon: 'fa-hourglass-half', tone: 'red', value: number(ending.length), label: 'Ending within 6 hours', foot: `Closest closes <strong>${positions.length ? countdownParts(positions[0].auction.end_date).text : '—'}</strong>` }),
      statCard({ icon: 'fa-robot', tone: 'purple', value: number(protectedCount), label: 'Auto-bid protected', foot: `Engine is <strong>${state.settings.autoBidEngine ? 'active' : 'paused'}</strong>` })
    ].join('');

    $$('#trackingTabs button').forEach(button => button.classList.toggle('active', button.dataset.trackFilter === ui.trackingFilter));
    let filtered = positions;
    if (ui.trackingFilter === 'winning') filtered = positions.filter(position => position.isWinning);
    if (ui.trackingFilter === 'outbid') filtered = positions.filter(position => !position.isWinning);
    if (ui.trackingFilter === 'ending') filtered = ending;

    byId('trackingGrid').innerHTML = filtered.map(({ auction, bid, highest, isWinning }) => {
      const rule = activeAutoBidFor(auction.id);
      const tracked = state.trackedAuctions.includes(auction.id);
      const countdown = countdownParts(auction.end_date);
      const second = state.bids.filter(item => item.auction_id === auction.id && item.status !== 'withdrawn' && item.id !== highest?.id).sort((a, b) => b.amount - a.amount)[0];
      const lead = highest ? highest.amount - (second?.amount || auction.current_price - auction.min_increment) : 0;
      const gap = Math.max(0, minNextBid(auction) - bid.amount);
      const alert = isWinning
        ? `<span class="tracking-alert"><i class="fa-solid fa-shield-halved"></i> Leading by ${money(Math.max(0, lead))}</span>`
        : `<span class="tracking-alert urgent"><i class="fa-solid fa-triangle-exclamation"></i> Increase by ${money(gap)} to lead</span>`;
      return `<article class="card tracking-card">
        <div class="tracking-card-top">
          <img src="${escapeHTML(auction.image)}" alt="${escapeHTML(auction.title)}">
          <div class="tracking-info">
            <h3>${escapeHTML(auction.title)}</h3>
            <p>${escapeHTML(auction.category)} · ${plural(auction.bid_count, 'bid')}</p>
            <span class="tracking-position ${isWinning ? 'winning' : countdown.urgent ? 'ending' : 'outbid'}"><i class="fa-solid ${isWinning ? 'fa-trophy' : countdown.urgent ? 'fa-clock' : 'fa-arrow-trend-down'}"></i>${isWinning ? 'Winning' : countdown.urgent ? 'Ending soon' : 'Outbid'}</span>
            ${rule ? '<span class="auto-bid-chip" style="margin-left:5px"><i class="fa-solid fa-robot"></i> Auto</span>' : ''}
          </div>
          <div class="tracking-price"><small>Current bid</small><strong>${money(auction.current_price)}</strong><span>${countdown.text}</span></div>
        </div>
        <div class="tracking-stats">
          <div class="tracking-stat"><small>Your bid</small><strong>${money(bid.amount)}</strong></div>
          <div class="tracking-stat"><small>Next minimum</small><strong>${money(minNextBid(auction))}</strong></div>
          <div class="tracking-stat"><small>Bid type</small><strong>${escapeHTML((TYPE_META[bid.bid_type] || TYPE_META.manual).label)}</strong></div>
          <div class="tracking-stat"><small>Tracked</small><strong>${tracked ? 'Yes' : 'No'}</strong></div>
        </div>
        <div class="tracking-footer">
          ${alert}
          <div class="tracking-footer-actions">
            <button class="btn btn-secondary" type="button" data-open-bid="${bid.id}">Details</button>
            <button class="btn btn-primary" type="button" data-place-auction="${auction.id}">${isWinning ? 'Raise bid' : 'Retake lead'}</button>
          </div>
        </div>
      </article>`;
    }).join('') || `<div class="card empty-state" style="grid-column:1/-1"><div class="empty-icon"><i class="fa-solid fa-satellite-dish"></i></div><h3>No bids in this view</h3><p>${positions.length ? 'Try another tracking filter.' : 'Place a bid to start tracking your position in real time.'}</p><button class="btn btn-primary" type="button" data-nav="place-bid">Place a bid</button></div>`;
  }

  /* ---------- History ---------- */
  function getHistoryRecords() {
    const filters = ui.historyFilters;
    const query = filters.search.trim().toLowerCase();
    return state.history.map(record => {
      const bid = getBid(record.bid_id);
      const auction = getAuction(record.auction_id);
      return bid && auction ? { ...record, bid, auction } : null;
    }).filter(record => {
      if (!record || record.bid.bidder_id !== currentUser().id) return false;
      if (filters.status && record.bid.status !== filters.status) return false;
      if (filters.type && record.bid.bid_type !== filters.type) return false;
      if (filters.from) {
        const from = new Date(filters.from + 'T00:00:00').getTime();
        if (new Date(record.timestamp).getTime() < from) return false;
      }
      if (filters.to) {
        const to = new Date(filters.to + 'T23:59:59').getTime();
        if (new Date(record.timestamp).getTime() > to) return false;
      }
      if (query) {
        const haystack = `${record.auction.title} BP-${1000 + record.bid.id} ${record.bid.bidder_name}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function historyDayLabel(value) {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  function renderHistory() {
    const records = getHistoryRecords();
    const all = userBids();
    const highest = all.length ? Math.max(...all.map(bid => bid.amount)) : 0;
    const totalValue = all.reduce((sum, bid) => sum + bid.amount, 0);
    const avg = all.length ? totalValue / all.length : 0;
    byId('historyStats').innerHTML = [
      statCard({ icon: 'fa-clock-rotate-left', value: number(all.length), label: 'Bids placed', foot: `Across <strong>${plural(new Set(all.map(bid => bid.auction_id)).size, 'auction')}</strong>` }),
      statCard({ icon: 'fa-arrow-up-long', tone: 'blue', value: money(highest), label: 'Highest bid', foot: `Average bid <strong>${money(avg)}</strong>` }),
      statCard({ icon: 'fa-sack-dollar', tone: 'purple', value: money(totalValue), label: 'Lifetime bid value', foot: `Includes active and closed bids` }),
      statCard({ icon: 'fa-percent', tone: 'amber', value: `${Math.round(winRate())}%`, label: 'Closed-auction win rate', foot: `<strong>${closedUserBids().filter(bid => bid.status === 'won').length}</strong> wins from ${closedUserBids().length} closed` })
    ].join('');

    byId('historySearch').value = ui.historyFilters.search;
    byId('historyStatus').value = ui.historyFilters.status;
    byId('historyType').value = ui.historyFilters.type;
    byId('historyFrom').value = ui.historyFilters.from;
    byId('historyTo').value = ui.historyFilters.to;
    byId('historyResultCount').textContent = `${plural(records.length, 'event')} in this view`;

    const groups = new Map();
    records.forEach(record => {
      const key = historyDayLabel(record.timestamp);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });

    byId('historyTimeline').innerHTML = [...groups.entries()].map(([label, entries]) => `
      <div class="history-day-group">
        <div class="history-day-heading">${escapeHTML(label)} <span>${entries.length}</span></div>
        ${entries.map(record => {
          const typeMeta = TYPE_META[record.bid.bid_type] || TYPE_META.manual;
          const dotClass = record.change_type === 'auto_bid' ? 'auto' : record.bid.status === 'won' ? 'win' : record.bid.status === 'lost' ? 'lost' : record.bid.status === 'outbid' ? 'outbid' : '';
          const title = record.change_type === 'auto_bid' ? 'Auto-bid raised your position' : record.change_type === 'withdrawn' ? 'Bid withdrawn' : record.bid.status === 'won' ? 'Auction won' : record.bid.status === 'lost' ? 'Auction lost' : 'Bid placed';
          const amounts = record.previous_amount
            ? `${money(record.previous_amount)} <i class="fa-solid fa-arrow-right" style="font-size:.5rem;color:var(--muted-2);margin:0 2px"></i> ${money(record.new_amount)}`
            : money(record.new_amount);
          return `<div class="history-event">
            <span class="history-dot ${dotClass}"><i class="fa-solid ${record.change_type === 'auto_bid' ? 'fa-robot' : record.bid.status === 'won' ? 'fa-trophy' : record.bid.status === 'lost' ? 'fa-xmark' : 'fa-gavel'}"></i></span>
            <div class="history-event-body">
              <div class="history-event-top"><strong>${title}</strong><span class="history-amount">${amounts}</span></div>
              <p><button class="text-link" type="button" data-open-bid="${record.bid.id}" style="font-size:.59rem">${escapeHTML(record.auction.title)}</button> · ${escapeHTML(typeMeta.label)} · ${statusPill(record.bid.status)}<span class="history-event-time">${formatTime(record.timestamp)}</span></p>
            </div>
          </div>`;
        }).join('')}
      </div>`).join('') || `<div class="empty-state"><div class="empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div><h3>No history matches</h3><p>Try a wider date range or clear the filters.</p></div>`;

    const typeCounts = Object.keys(TYPE_META).map(type => ({
      type, count: all.filter(bid => bid.bid_type === type).length
    })).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    const categoryCounts = [...new Set(all.map(bid => getAuction(bid.auction_id)?.category).filter(Boolean))].map(category => ({
      category, count: all.filter(bid => getAuction(bid.auction_id)?.category === category).length
    })).sort((a, b) => b.count - a.count);
    const maxType = Math.max(1, ...typeCounts.map(item => item.count));
    const outbidCount = all.filter(bid => bid.status === 'outbid').length;
    const outbidRate = all.length ? Math.round((outbidCount / all.length) * 100) : 0;
    byId('historyPatterns').innerHTML = `
      ${typeCounts.slice(0, 3).map(item => `<div class="history-pattern-row"><div class="history-pattern-label"><span>${escapeHTML((TYPE_META[item.type] || TYPE_META.manual).label)}</span><strong>${item.count}</strong></div><div class="pattern-bar"><span style="width:${(item.count / maxType) * 100}%"></span></div></div>`).join('')}
      <div class="history-pattern-row"><div class="history-pattern-label"><span>Most active category</span><strong>${escapeHTML(categoryCounts[0]?.category || '—')}</strong></div><div class="pattern-bar"><span style="width:78%"></span></div></div>
      <div class="history-pattern-row"><div class="history-pattern-label"><span>Outbid rate</span><strong>${outbidRate}%</strong></div><div class="pattern-bar"><span style="width:${outbidRate}%;background:linear-gradient(90deg,var(--amber),#fbbf24)"></span></div></div>`;
    byId('historyTip').textContent = outbidRate > 30
      ? 'Your outbid rate is above 30%. A private maximum bid with auto-bid can help you stay competitive without overpaying.'
      : 'You are winning more than you lose. Keep using private maximum limits to protect your budget near auction close.';
  }

  function exportHistoryCSV() {
    const records = getHistoryRecords();
    if (!records.length) {
      showToast('Nothing to export', 'No history matches the current filters.', 'warning');
      return;
    }
    const header = ['Event', 'Bid ID', 'Auction', 'Previous Amount', 'New Amount', 'Type', 'Status', 'Timestamp'];
    const rows = records.map(record => [
      record.change_type, `BP-${1000 + record.bid.id}`, record.auction.title,
      record.previous_amount ?? '', record.new_amount ?? '',
      (TYPE_META[record.bid.bid_type] || TYPE_META.manual).label,
      STATUS_META[record.bid.status]?.label || record.bid.status,
      formatDateTime(record.timestamp)
    ]);
    downloadFile('bidpro-bid-history.csv', [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n'));
    showToast('History exported', `${plural(records.length, 'event')} saved as CSV.`);
  }

  /* ---------- Auto-bid ---------- */
  function updateSimulationUI() {
    const toggle = byId('simulationToggle');
    if (!toggle) return;
    toggle.setAttribute('aria-checked', String(Boolean(state.settings.simulation)));
    const engine = byId('autoBidNavState');
    if (engine) {
      engine.textContent = state.settings.autoBidEngine ? 'ON' : 'OFF';
      engine.classList.toggle('off', !state.settings.autoBidEngine);
    }
  }

  function startSimulation() {
    if (ui.simulationTimer) clearInterval(ui.simulationTimer);
    ui.simulationTimer = null;
    if (!state.settings.simulation) return;
    ui.simulationTimer = setInterval(() => {
      if (!isLoggedIn() || document.hidden || !byId('modalBackdrop').hidden) return;
      const candidates = activeAuctions().filter(auction => userHighestBid(auction.id) || activeAutoBidFor(auction.id));
      if (!candidates.length) return;
      const auction = candidates[Math.floor(Math.random() * candidates.length)];
      simulateCompetingBid(auction.id, { manual: false });
    }, 40000);
  }

  function renderAutoBid() {
    const activeRules = state.autoBids.filter(rule => rule.status === 'active');
    const maxExposure = activeRules.reduce((sum, rule) => sum + rule.max_amount, 0);
    const autoBidCount = state.bids.filter(bid => bid.bidder_id === currentUser().id && bid.bid_type === 'auto').length;
    byId('autoBidEngine').checked = state.settings.autoBidEngine;
    byId('autoBidEngineTitle').textContent = state.settings.autoBidEngine ? 'Your auto-bid engine is active' : 'Your auto-bid engine is paused';
    byId('autoBidEngineLabel').textContent = state.settings.autoBidEngine ? 'Engine on' : 'Engine off';

    byId('autoBidStats').innerHTML = [
      statCard({ icon: 'fa-robot', value: number(activeRules.length), label: 'Active auto-bid rules', foot: `<strong>${state.autoBids.filter(rule => rule.status === 'paused').length}</strong> paused · ${state.autoBids.filter(rule => rule.status === 'completed').length} completed` }),
      statCard({ icon: 'fa-shield-halved', tone: 'blue', value: number(new Set(activeRules.map(rule => rule.auction_id)).size), label: 'Auctions protected', foot: `Across <strong>${plural(activeRules.length, 'rule')}</strong>` }),
      statCard({ icon: 'fa-sack-dollar', tone: 'purple', value: money(maxExposure), label: 'Maximum exposure', foot: `Combined private limits of active rules` }),
      statCard({ icon: 'fa-bolt', tone: 'amber', value: number(autoBidCount), label: 'Auto-bids placed', foot: `<strong>${state.bids.filter(bid => bid.bidder_id === currentUser().id && bid.bid_type === 'auto' && bid.status === 'winning').length}</strong> currently leading` })
    ].join('');

    byId('autoBidRuleCount').textContent = plural(state.autoBids.length, 'rule');
    const sortedRules = [...state.autoBids].sort((a, b) => {
      const rank = { active: 0, paused: 1, completed: 2 };
      return rank[a.status] - rank[b.status] || a.id - b.id;
    });
    byId('autoBidRules').innerHTML = sortedRules.map(rule => {
      const auction = getAuction(rule.auction_id);
      if (!auction) return '';
      const progress = clamp((auction.current_price / rule.max_amount) * 100, 0, 100);
      const headroom = Math.max(0, rule.max_amount - auction.current_price);
      return `<article class="card auto-rule-card ${rule.status !== 'active' ? 'paused' : ''}">
        <div class="auto-rule-head">
          <img src="${escapeHTML(auction.image)}" alt="${escapeHTML(auction.title)}">
          <div class="auto-rule-title"><h3>${escapeHTML(auction.title)}</h3><p>${escapeHTML(auction.category)} · ${rule.strategy} strategy</p></div>
          <span class="rule-status ${rule.status}">${rule.status}</span>
        </div>
        <div class="auto-rule-body">
          <div class="auto-rule-prices">
            <div><small>Current bid</small><strong>${money(auction.current_price)}</strong></div>
            <div><small>Your max</small><strong class="green">${money(rule.max_amount)}</strong></div>
            <div><small>Increment</small><strong>+${money(rule.increment)}</strong></div>
          </div>
          <div class="rule-progress-meta"><span>Limit usage</span><strong>${money(headroom)} headroom</strong></div>
          <div class="rule-progress"><span style="width:${progress}%"></span></div>
          <div class="rule-actions">
            <button class="text-link" type="button" data-open-bid="${userHighestBid(auction.id)?.id || ''}" ${userHighestBid(auction.id) ? '' : 'disabled'}><i class="fa-solid fa-arrow-up-right-from-square"></i> View auction bid</button>
            <div class="rule-buttons">
              <label class="switch" title="${rule.status === 'active' ? 'Pause rule' : 'Activate rule'}"><input type="checkbox" data-toggle-autobid="${rule.id}" ${rule.status === 'active' ? 'checked' : ''} ${rule.status === 'completed' ? 'disabled' : ''}><span></span></label>
              <button class="row-action-btn" type="button" data-edit-autobid="${rule.id}" aria-label="Edit rule"><i class="fa-solid fa-pen"></i></button>
              <button class="row-action-btn" type="button" data-delete-autobid="${rule.id}" aria-label="Delete rule"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('') || `<div class="card auto-bid-empty"><div class="empty-icon"><i class="fa-solid fa-robot"></i></div><h3>No auto-bid rules yet</h3><p>Set a private maximum and let BidPro keep you competitive.</p><button class="btn btn-primary" type="button" id="emptyNewAutoBid"><i class="fa-solid fa-plus"></i> Create your first rule</button></div>`;

    byId('emptyNewAutoBid')?.addEventListener('click', () => openAutoBidModal());
    updateCalculator();
    updateSimulationUI();
  }

  function openAutoBidModal(ruleId = null) {
    const rule = ruleId ? state.autoBids.find(item => item.id === Number(ruleId)) : null;
    ui.editingAutoBidId = rule ? rule.id : null;
    const options = activeAuctions().map(auction => `<option value="${auction.id}" ${rule?.auction_id === auction.id ? 'selected' : ''}>${escapeHTML(auction.title)} — ${money(auction.current_price)}</option>`).join('');
    const selectedAuction = rule ? getAuction(rule.auction_id) : activeAuctions()[0];
    const current = selectedAuction ? selectedAuction.current_price : 0;
    const minInc = selectedAuction ? selectedAuction.min_increment : 100;
    openModal({
      title: rule ? 'Edit auto-bid rule' : 'Create auto-bid rule',
      eyebrow: 'Automated bidding',
      body: `<form id="autoBidForm" class="modal-form" novalidate>
        <label class="field"><span class="field-label">Auction</span><span class="select-wrap"><select id="autoBidAuction" required ${rule ? 'disabled' : ''}>${options || '<option value="">No active auctions</option>'}</select></span></label>
        <div class="modal-note"><i class="fa-solid fa-shield-halved"></i><span>Your maximum is private. BidPro only bids the smallest increment needed to keep you in the lead.</span></div>
        <div class="form-row">
          <label class="field"><span class="field-label">Maximum bid <span class="required">*</span></span><span class="input-money"><span>$</span><input type="number" id="autoBidMax" min="${current + minInc}" step="1" value="${rule ? rule.max_amount : current + 1000}" required></span><small class="field-hint">Absolute limit, including all increments.</small></label>
          <label class="field"><span class="field-label">Bid increment <span class="required">*</span></span><span class="input-money"><span>$</span><input type="number" id="autoBidIncrement" min="1" step="1" value="${rule ? rule.increment : minInc}" required></span><small class="field-hint">Amount added when outbid.</small></label>
        </div>
        <label class="field"><span class="field-label">Strategy</span><span class="select-wrap"><select id="autoBidStrategy"><option value="conservative" ${rule?.strategy === 'conservative' ? 'selected' : ''}>Conservative — smallest increments</option><option value="standard" ${!rule || rule.strategy === 'standard' ? 'selected' : ''}>Standard — balanced protection</option><option value="aggressive" ${rule?.strategy === 'aggressive' ? 'selected' : ''}>Aggressive — larger jumps</option></select></span></label>
        <div class="modal-note" id="autoBidPreview"><i class="fa-solid fa-circle-info"></i><span>Current bid: ${money(current)} · minimum next bid: ${money(current + minInc)}</span></div>
      </form>`,
      footer: `<button class="btn btn-secondary" type="button" data-modal-cancel>Cancel</button><button class="btn btn-primary" type="submit" form="autoBidForm"><i class="fa-solid fa-robot"></i> ${rule ? 'Save changes' : 'Create rule'}</button>`
    });
    const auctionSelect = byId('autoBidAuction');
    if (!auctionSelect || !options) return;
    auctionSelect.addEventListener('change', () => {
      const auction = getAuction(auctionSelect.value);
      if (!auction) return;
      byId('autoBidMax').value = auction.current_price + 1000;
      byId('autoBidIncrement').value = auction.min_increment;
      byId('autoBidPreview').innerHTML = `<i class="fa-solid fa-circle-info"></i><span>Current bid: ${money(auction.current_price)} · minimum next bid: ${money(minNextBid(auction))}</span>`;
    });
    byId('autoBidForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const auctionId = Number(auctionSelect.value);
      const auction = getAuction(auctionId);
      const max = Number(byId('autoBidMax').value);
      const increment = Number(byId('autoBidIncrement').value);
      const strategy = byId('autoBidStrategy').value;
      if (!auction) return showToast('Choose an auction', 'Select an active auction first.', 'warning');
      if (!Number.isFinite(max) || max <= auction.current_price) return showToast('Maximum too low', 'Your maximum must be higher than the current bid.', 'error');
      if (!Number.isFinite(increment) || increment < 1) return showToast('Invalid increment', 'Choose an increment of at least $1.', 'error');
      if (!rule) {
        const existing = state.autoBids.find(item => item.auction_id === auctionId && item.user_id === currentUser().id && item.status !== 'completed');
        if (existing) return showToast('Rule already exists', 'Edit the existing rule for this auction instead.', 'warning');
      }
      if (rule) {
        rule.max_amount = max;
        rule.increment = increment;
        rule.strategy = strategy;
        rule.status = 'active';
      } else {
        state.autoBids.push({
          id: state.nextAutoBidId++, user_id: currentUser().id, auction_id: auctionId,
          max_amount: max, increment, status: 'active', strategy, created_at: new Date().toISOString()
        });
      }
      saveState();
      closeModal();
      renderAutoBid();
      updateNavCounts();
      showToast(rule ? 'Auto-bid rule updated' : 'Auto-bid rule created', `${money(max)} private limit on ${auction.title}.`);
    });
  }

  function toggleAutoBidRule(ruleId, active) {
    const rule = state.autoBids.find(item => item.id === Number(ruleId));
    if (!rule) return;
    rule.status = active ? 'active' : 'paused';
    saveState();
    renderAutoBid();
    updateNavCounts();
    showToast(active ? 'Auto-bid rule activated' : 'Auto-bid rule paused', active ? 'BidPro will protect this auction again.' : 'No automatic bids will be placed for this rule.', active ? 'success' : 'warning');
  }

  function deleteAutoBidRule(ruleId) {
    const rule = state.autoBids.find(item => item.id === Number(ruleId));
    if (!rule) return;
    const auction = getAuction(rule.auction_id);
    confirmAction({
      title: 'Delete auto-bid rule?',
      message: `This removes your ${money(rule.max_amount)} private limit for ${auction?.title || 'this auction'}. You can create a new rule at any time.`,
      confirmLabel: 'Delete rule',
      onConfirm: () => {
        state.autoBids = state.autoBids.filter(item => item.id !== rule.id);
        saveState();
        renderAutoBid();
        updateNavCounts();
        showToast('Rule deleted', 'The auto-bid rule has been removed.', 'warning');
      }
    });
  }

  function runAutoBidEngine(auctionId) {
    if (!state.settings.autoBidEngine) return false;
    const rule = activeAutoBidFor(auctionId);
    if (!rule) return false;
    const auction = getAuction(auctionId);
    const highest = currentHighestBid(auctionId);
    if (!auction || !highest || highest.bidder_id === currentUser().id) return false;
    const nextAmount = Math.max(highest.amount + Number(rule.increment), minNextBid(auction));
    if (nextAmount > rule.max_amount) return false;
    highest.status = 'outbid';
    const autoBid = {
      id: state.nextBidId++,
      auction_id: auctionId,
      bidder_id: currentUser().id,
      bidder_name: currentUser().name,
      amount: Math.min(nextAmount, rule.max_amount),
      status: 'winning',
      timestamp: new Date().toISOString(),
      bid_type: 'auto',
      note: 'Placed automatically by the BidPro auto-bid engine.'
    };
    state.bids.push(autoBid);
    auction.current_price = autoBid.amount;
    auction.bid_count = state.bids.filter(item => item.auction_id === auctionId && item.status !== 'withdrawn').length;
    addHistoryEntry(autoBid, 'auto_bid');
    notifyUser({
      type: 'auto', title: 'Auto-bid protected your lead',
      message: `BidPro placed a ${money(autoBid.amount)} auto-bid on ${auction.title}.`,
      auctionId, bidId: autoBid.id
    });
    showToast('Auto-bid placed', `You're back in the lead at ${money(autoBid.amount)} on ${auction.title}.`);
    return true;
  }

  function simulateCompetingBid(auctionId = null, { manual = false } = {}) {
    const pool = auctionId ? [getAuction(auctionId)] : activeAuctions();
    const candidates = pool.filter(auction => auction && auction.status === 'active');
    if (!candidates.length) {
      if (manual) showToast('No active auctions', 'There are no live auctions to simulate right now.', 'warning');
      return;
    }
    const auction = candidates[Math.floor(Math.random() * candidates.length)];
    const previousHighest = currentHighestBid(auction.id);
    const competitors = BIDDER_POOL.filter(bidder => bidder.id !== previousHighest?.bidder_id);
    const competitor = competitors[Math.floor(Math.random() * competitors.length)] || BIDDER_POOL[0];
    const amount = Math.max(minNextBid(auction), (previousHighest?.amount || auction.current_price) + auction.min_increment);
    if (previousHighest) previousHighest.status = 'outbid';
    const bid = {
      id: state.nextBidId++,
      auction_id: auction.id,
      bidder_id: competitor.id,
      bidder_name: competitor.name,
      amount,
      status: 'winning',
      timestamp: new Date().toISOString(),
      bid_type: Math.random() > 0.72 ? 'auto' : 'manual'
    };
    state.bids.push(bid);
    auction.current_price = amount;
    auction.bid_count = state.bids.filter(item => item.auction_id === auction.id && item.status !== 'withdrawn').length;
    addHistoryEntry(bid, bid.bid_type === 'auto' ? 'auto_bid' : 'placed');
    if (previousHighest && previousHighest.bidder_id === currentUser().id) {
      notifyUser({
        type: 'outbid', title: 'You’ve been outbid',
        message: `${competitor.name} placed ${money(amount)} on ${auction.title}. Increase your bid to retake the lead.`,
        auctionId: auction.id, bidId: bid.id
      });
    }
    const autoBidPlaced = runAutoBidEngine(auction.id);
    saveState();
    renderCurrentPage();
    renderNotifications();
    updateNavCounts();
    if (manual && !autoBidPlaced) {
      showToast('Competing bid simulated', `${competitor.name} bid ${money(amount)} on ${auction.title}.`, 'warning');
    }
  }

  function updateCalculator() {
    const current = Number(byId('calcCurrent')?.value) || 0;
    const max = Number(byId('calcMax')?.value) || 0;
    const increment = Math.max(1, Number(byId('calcIncrement')?.value) || 1);
    const result = byId('calcResult');
    if (!result) return;
    if (max <= current) {
      result.innerHTML = `<strong>0 bids possible</strong><p>Your maximum needs to be higher than the current price.</p>`;
      return;
    }
    const bids = Math.floor((max - current) / increment);
    result.innerHTML = `<strong>${bids} bids possible</strong><p>From ${money(current)} to ${money(max)} in ${money(increment)} increments.</p>`;
  }

  /* ---------- Analytics ---------- */
  function analyticsBids() {
    if (ui.analyticsRange === 'all') return userBids();
    const cutoff = Date.now() - Number(ui.analyticsRange) * 86400000;
    return userBids().filter(bid => new Date(bid.timestamp).getTime() >= cutoff);
  }

  function renderAnalytics() {
    const bids = analyticsBids();
    const closed = bids.filter(bid => ['won', 'lost'].includes(bid.status));
    const won = bids.filter(bid => bid.status === 'won');
    const winRateValue = closed.length ? (won.length / closed.length) * 100 : 0;
    const wonValue = won.reduce((sum, bid) => sum + bid.amount, 0);
    const avgWin = won.length ? wonValue / won.length : 0;
    const avgBid = bids.length ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length : 0;

    byId('analyticsRange').value = String(ui.analyticsRange);
    byId('analyticsStats').innerHTML = [
      statCard({ icon: 'fa-gavel', value: number(bids.length), label: 'Bids placed', foot: `In the selected period` }),
      statCard({ icon: 'fa-trophy', tone: 'blue', value: `${Math.round(winRateValue)}%`, label: 'Win rate', foot: `<strong>${won.length}</strong> wins from ${closed.length} closed` }),
      statCard({ icon: 'fa-sack-dollar', tone: 'purple', value: money(wonValue), label: 'Value of wins', foot: `Average winning bid <strong>${money(avgWin)}</strong>` }),
      statCard({ icon: 'fa-calculator', tone: 'amber', value: money(avgBid), label: 'Average bid', foot: `Highest <strong>${money(bids.length ? Math.max(...bids.map(bid => bid.amount)) : 0)}</strong>` })
    ].join('');

    const days = ui.analyticsRange === 'all' ? 90 : Number(ui.analyticsRange);
    const buckets = buildSeries(days, bids);
    renderLineChart(byId('analyticsSpendChart'), buckets, { id: 'analyticsSpend', height: 250 });

    const outcomeSegments = [
      { label: 'Won', value: bids.filter(bid => bid.status === 'won').length, color: '#059669' },
      { label: 'Winning', value: bids.filter(bid => ['winning', 'placed'].includes(bid.status)).length, color: '#34d399' },
      { label: 'Outbid', value: bids.filter(bid => bid.status === 'outbid').length, color: '#f59e0b' },
      { label: 'Lost', value: bids.filter(bid => bid.status === 'lost').length, color: '#ef4444' },
      { label: 'Pending', value: bids.filter(bid => bid.status === 'pending').length, color: '#60a5fa' }
    ].filter(segment => segment.value > 0);
    renderDonut(byId('analyticsOutcomeChart'), outcomeSegments, 'bids');

    const categoryMap = new Map();
    bids.forEach(bid => {
      const auction = getAuction(bid.auction_id);
      if (!auction) return;
      categoryMap.set(auction.category, (categoryMap.get(auction.category) || 0) + bid.amount);
    });
    const categories = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCategory = Math.max(1, ...categories.map(([, value]) => value));
    byId('analyticsCategoryChart').innerHTML = categories.map(([category, value], index) => `
      <div class="bar-item"><div class="bar-item-label"><span>${escapeHTML(category)}</span><strong>${money(value)}</strong></div><div class="bar-track"><span class="bar-fill ${['', 'blue', 'amber', 'purple', ''][index] || ''}" style="width:${(value / maxCategory) * 100}%"></span></div></div>
    `).join('') || '<div class="analytics-empty">No category spend in this period.</div>';

    const typeRows = Object.keys(TYPE_META).map(type => {
      const typeBids = bids.filter(bid => bid.bid_type === type);
      const typeClosed = typeBids.filter(bid => ['won', 'lost'].includes(bid.status));
      const typeWins = typeBids.filter(bid => bid.status === 'won').length;
      const rate = typeClosed.length ? (typeWins / typeClosed.length) * 100 : typeBids.length ? (typeBids.filter(bid => ['winning', 'placed'].includes(bid.status)).length / typeBids.length) * 100 : 0;
      return { type, count: typeBids.length, rate };
    }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    byId('analyticsTypeChart').innerHTML = typeRows.map(item => `
      <div class="type-perf-row">
        <span><i class="fa-solid ${(TYPE_META[item.type] || TYPE_META.manual).icon}"></i>${escapeHTML((TYPE_META[item.type] || TYPE_META.manual).label)}</span>
        <div class="type-perf-track"><span style="width:${item.rate}%"></span></div>
        <strong>${Math.round(item.rate)}%</strong>
      </div>`).join('') || '<div class="analytics-empty">No bid type data yet.</div>';

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const slots = [
      { label: 'Night', start: 0, end: 6 },
      { label: 'Morning', start: 6, end: 12 },
      { label: 'Afternoon', start: 12, end: 18 },
      { label: 'Evening', start: 18, end: 24 }
    ];
    const heatCounts = slots.map(slot => dayNames.map((_, day) => bids.filter(bid => {
      const date = new Date(bid.timestamp);
      const jsDay = (date.getDay() + 6) % 7;
      const hour = date.getHours();
      return jsDay === day && hour >= slot.start && hour < slot.end;
    }).length));
    const heatMax = Math.max(1, ...heatCounts.flat());
    byId('analyticsHeatmap').innerHTML = `
      <div class="heatmap">
        <div class="heatmap-label"></div>
        ${dayNames.map(day => `<div class="heatmap-day">${day}</div>`).join('')}
        ${slots.map((slot, row) => `<div class="heatmap-label">${slot.label}</div>${dayNames.map((_, col) => {
          const count = heatCounts[row][col];
          const level = count === 0 ? 0 : clamp(Math.ceil((count / heatMax) * 5), 1, 5);
          return `<div class="heatmap-cell" data-level="${level}" title="${slot.label} ${dayNames[col]}: ${plural(count, 'bid')}"></div>`;
        }).join('')}`).join('')}
      </div>`;

    const bestCategory = categories[0]?.[0] || '—';
    const bestType = [...typeRows].sort((a, b) => b.rate - a.rate)[0];
    const outbidRate = bids.length ? Math.round((bids.filter(bid => bid.status === 'outbid').length / bids.length) * 100) : 0;
    const endingSoon = userPositions().filter(position => countdownParts(position.auction.end_date).diff < 6 * 3600000).length;
    byId('analyticsInsights').innerHTML = [
      { icon: 'fa-layer-group', title: 'Strongest category', text: bestCategory === '—' ? 'Place more bids to reveal your category strengths.' : `${escapeHTML(bestCategory)} accounts for your largest share of bid value.` },
      { icon: 'fa-bullseye', title: 'Best strategy', text: bestType ? `${escapeHTML((TYPE_META[bestType.type] || TYPE_META.manual).label)} bids are converting at ${Math.round(bestType.rate)}%.` : 'Try a few bid types to compare performance.' },
      { icon: 'fa-triangle-exclamation', title: 'Outbid exposure', text: `${outbidRate}% of bids in this period are currently outbid. ${outbidRate > 35 ? 'Consider a slightly higher private limit.' : 'Your position management is on track.'}` },
      { icon: 'fa-hourglass-half', title: 'Closing soon', text: `${plural(endingSoon, 'tracked auction')} closing within six hours. Review your maximums before the final stretch.` }
    ].map(item => `<div class="insight-tile"><span class="insight-icon"><i class="fa-solid ${item.icon}"></i></span><h4>${item.title}</h4><p>${item.text}</p></div>`).join('');
  }

  function exportAnalyticsCSV() {
    const bids = analyticsBids();
    if (!bids.length) return showToast('Nothing to export', 'No bid data in this period.', 'warning');
    const header = ['Bid ID', 'Auction', 'Amount', 'Type', 'Status', 'Result', 'Placed At'];
    const rows = bids.map(bid => {
      const auction = getAuction(bid.auction_id);
      return [`BP-${1000 + bid.id}`, auction?.title || '', bid.amount, (TYPE_META[bid.bid_type] || TYPE_META.manual).label, STATUS_META[bid.status]?.label || bid.status, resultForBid(bid), formatDateTime(bid.timestamp)];
    });
    downloadFile('bidpro-analytics.csv', [header, ...rows].map(row => row.map(csvEscape).join(',')).join('\n'));
    showToast('Analytics exported', `${plural(bids.length, 'bid')} saved as CSV.`);
  }

  /* ---------- Reports ---------- */
  const REPORT_META = {
    bids: { title: 'Bid Activity Report', subtitle: 'A complete record of bids placed in the selected period.', file: 'bid-activity' },
    spending: { title: 'Spending Report', subtitle: 'Bid value and spending distribution by auction.', file: 'spending' },
    winning: { title: 'Winning Report', subtitle: 'Won and currently leading bids with values and results.', file: 'winning' },
    auction: { title: 'Auction Performance Report', subtitle: 'Status, competition, and pricing across auctions.', file: 'auction-performance' },
    autobid: { title: 'Auto-Bid Report', subtitle: 'Automation rules, private limits, and protection status.', file: 'auto-bid' }
  };

  function defaultReportDates() {
    return {
      from: dateInputValue(new Date(Date.now() - 90 * 86400000)),
      to: dateInputValue(new Date())
    };
  }

  function getReportConfig() {
    const defaults = defaultReportDates();
    return {
      type: byId('reportType')?.value || 'bids',
      from: byId('reportFrom')?.value || defaults.from,
      to: byId('reportTo')?.value || defaults.to,
      summary: byId('reportSummaryCheck')?.checked ?? true,
      table: byId('reportTableCheck')?.checked ?? true,
      insights: byId('reportInsightsCheck')?.checked ?? true
    };
  }

  function inReportRange(value, config) {
    const time = new Date(value).getTime();
    const from = config.from ? new Date(config.from + 'T00:00:00').getTime() : 0;
    const to = config.to ? new Date(config.to + 'T23:59:59').getTime() : Infinity;
    return time >= from && time <= to;
  }

  function buildReport(config = getReportConfig()) {
    const meta = REPORT_META[config.type] || REPORT_META.bids;
    const bids = userBids().filter(bid => inReportRange(bid.timestamp, config));
    let columns = [];
    let rows = [];
    let stats = [];
    let insights = [];

    if (config.type === 'bids') {
      columns = ['Bid ID', 'Auction', 'Category', 'Amount', 'Type', 'Status', 'Result', 'Placed'];
      rows = bids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(bid => {
        const auction = getAuction(bid.auction_id);
        return [`BP-${1000 + bid.id}`, auction?.title || '—', auction?.category || '—', money(bid.amount), (TYPE_META[bid.bid_type] || TYPE_META.manual).label, STATUS_META[bid.status]?.label || bid.status, resultForBid(bid), formatDate(bid.timestamp)];
      });
      const value = bids.reduce((sum, bid) => sum + bid.amount, 0);
      stats = [
        { label: 'Bids placed', value: number(bids.length) },
        { label: 'Total bid value', value: money(value) },
        { label: 'Win rate', value: `${Math.round(winRate())}%` },
        { label: 'Leading bids', value: number(bids.filter(bid => ['winning', 'placed'].includes(bid.status)).length) }
      ];
      insights = [
        `You placed ${plural(bids.length, 'bid')} in this period, with an average bid value of ${money(bids.length ? value / bids.length : 0)}.`,
        `${bids.filter(bid => ['winning', 'placed'].includes(bid.status)).length} bids are currently leading their auctions.`
      ];
    } else if (config.type === 'spending') {
      const map = new Map();
      bids.forEach(bid => {
        const auction = getAuction(bid.auction_id);
        if (!auction) return;
        if (!map.has(auction.id)) map.set(auction.id, { auction, total: 0, count: 0, latest: bid.timestamp });
        const entry = map.get(auction.id);
        entry.total += bid.amount;
        entry.count += 1;
        if (new Date(bid.timestamp) > new Date(entry.latest)) entry.latest = bid.timestamp;
      });
      const entries = [...map.values()].sort((a, b) => b.total - a.total);
      columns = ['Auction', 'Category', 'Bids', 'Total Value', 'Average', 'Latest Bid'];
      rows = entries.map(entry => [entry.auction.title, entry.auction.category, entry.count, money(entry.total), money(entry.total / entry.count), formatDate(entry.latest)]);
      const total = entries.reduce((sum, entry) => sum + entry.total, 0);
      const category = entries.reduce((best, entry) => {
        const current = entries.filter(item => item.auction.category === entry.auction.category).reduce((sum, item) => sum + item.total, 0);
        return !best || current > best.value ? { name: entry.auction.category, value: current } : best;
      }, null);
      stats = [
        { label: 'Total bid value', value: money(total) },
        { label: 'Auctions bid on', value: number(entries.length) },
        { label: 'Average per auction', value: money(entries.length ? total / entries.length : 0) },
        { label: 'Top category', value: category?.name || '—' }
      ];
      insights = [
        `Your highest-value auction is ${entries[0]?.auction.title || '—'} at ${money(entries[0]?.total || 0)}.`,
        category ? `${category.name} represents ${money(category.value)} of bid value in this period.` : 'No spending data in this period.'
      ];
    } else if (config.type === 'winning') {
      const winningBids = bids.filter(bid => ['won', 'winning', 'placed'].includes(bid.status)).sort((a, b) => b.amount - a.amount);
      columns = ['Bid ID', 'Auction', 'Amount', 'Type', 'Status', 'Result', 'Date'];
      rows = winningBids.map(bid => {
        const auction = getAuction(bid.auction_id);
        return [`BP-${1000 + bid.id}`, auction?.title || '—', money(bid.amount), (TYPE_META[bid.bid_type] || TYPE_META.manual).label, STATUS_META[bid.status]?.label || bid.status, resultForBid(bid), formatDate(bid.timestamp)];
      });
      const won = winningBids.filter(bid => bid.status === 'won');
      const wonValue = won.reduce((sum, bid) => sum + bid.amount, 0);
      stats = [
        { label: 'Auctions won', value: number(won.length) },
        { label: 'Won value', value: money(wonValue) },
        { label: 'Average winning bid', value: money(won.length ? wonValue / won.length : 0) },
        { label: 'Currently leading', value: number(winningBids.filter(bid => ['winning', 'placed'].includes(bid.status)).length) }
      ];
      insights = [
        `Your closed-auction win rate is ${Math.round(winRate())}%.`,
        `The highest winning bid in this report is ${money(winningBids.length ? winningBids[0].amount : 0)}.`
      ];
    } else if (config.type === 'auction') {
      const auctions = state.auctions.filter(auction => inReportRange(auction.end_date, config));
      columns = ['Auction', 'Category', 'Current Bid', 'Bids', 'Watchers', 'Status', 'Ends'];
      rows = auctions.sort((a, b) => new Date(b.end_date) - new Date(a.end_date)).map(auction => [
        auction.title, auction.category, money(auction.current_price), auction.bid_count, auction.watchers, auction.status === 'active' ? 'Active' : 'Ended', formatDate(auction.end_date)
      ]);
      stats = [
        { label: 'Auctions in report', value: number(auctions.length) },
        { label: 'Live auctions', value: number(auctions.filter(auction => auction.status === 'active').length) },
        { label: 'Combined current value', value: money(auctions.reduce((sum, auction) => sum + auction.current_price, 0)) },
        { label: 'Average bids per auction', value: (auctions.length ? auctions.reduce((sum, auction) => sum + auction.bid_count, 0) / auctions.length : 0).toFixed(1) }
      ];
      insights = [
        `${auctions.filter(auction => auction.status === 'active').length} auctions are still accepting bids.`,
        `Average competition is ${(auctions.length ? auctions.reduce((sum, auction) => sum + auction.bid_count, 0) / auctions.length : 0).toFixed(1)} bids per auction.`
      ];
    } else {
      columns = ['Auction', 'Status', 'Maximum Bid', 'Increment', 'Current Bid', 'Headroom', 'Strategy'];
      rows = state.autoBids.map(rule => {
        const auction = getAuction(rule.auction_id);
        return [auction?.title || '—', rule.status, money(rule.max_amount), money(rule.increment), money(auction?.current_price || 0), money(Math.max(0, rule.max_amount - (auction?.current_price || 0))), rule.strategy];
      });
      const active = state.autoBids.filter(rule => rule.status === 'active');
      stats = [
        { label: 'Active rules', value: number(active.length) },
        { label: 'Maximum exposure', value: money(active.reduce((sum, rule) => sum + rule.max_amount, 0)) },
        { label: 'Protected auctions', value: number(new Set(active.map(rule => rule.auction_id)).size) },
        { label: 'Auto-bids placed', value: number(state.bids.filter(bid => bid.bidder_id === currentUser().id && bid.bid_type === 'auto').length) }
      ];
      insights = [
        `You have ${plural(active.length, 'active rule')} protecting ${plural(new Set(active.map(rule => rule.auction_id)).size, 'auction')}.`,
        `The engine is currently ${state.settings.autoBidEngine ? 'enabled' : 'paused'}.`
      ];
    }

    return { ...meta, ...config, columns, rows, stats, insights };
  }

  function renderReportPreview() {
    if (!isLoggedIn()) return;
    const config = getReportConfig();
    const report = buildReport(config);
    byId('reportPreviewMeta').textContent = `${report.title} · ${formatDateShort(config.from)} – ${formatDateShort(config.to)}`;
    const summaryHTML = config.summary ? `<div class="report-summary-grid">${report.stats.map(stat => `<div class="report-summary-box"><small>${escapeHTML(stat.label)}</small><strong>${escapeHTML(stat.value)}</strong></div>`).join('')}</div>` : '';
    const tableHTML = config.table ? `<div class="table-responsive"><table class="report-table"><thead><tr>${report.columns.map(column => `<th>${escapeHTML(column)}</th>`).join('')}</tr></thead><tbody>${report.rows.slice(0, 8).map(row => `<tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${report.columns.length}" style="text-align:center;color:var(--muted);padding:20px">No records in this period.</td></tr>`}</tbody></table></div>${report.rows.length > 8 ? `<p style="font-size:.56rem;color:var(--muted-2);margin-top:6px">Preview shows 8 of ${report.rows.length} rows. Export includes all records.</p>` : ''}` : '';
    const insightsHTML = config.insights && report.insights.length ? `<div class="report-insights"><strong>Performance insights</strong><p>${report.insights.map(escapeHTML).join(' ')}</p></div>` : '';
    byId('reportPreview').innerHTML = `
      <div class="report-doc-head">
        <div class="report-doc-brand"><span class="brand-mark"><i class="fa-solid fa-gavel"></i></span><span class="brand-word">Bid<span>Pro</span></span></div>
        <div class="report-doc-meta"><h3>${escapeHTML(report.title)}</h3><p>${formatDate(config.from)} – ${formatDate(config.to)}</p></div>
      </div>
      ${summaryHTML}
      ${tableHTML}
      ${insightsHTML}
      <div class="report-doc-foot"><span>Generated by BidPro · ${formatDateTime(new Date())}</span><span>Confidential bid intelligence</span></div>`;
  }

  function reportFileName(report) {
    return `bidpro-${report.file}-${report.from}-to-${report.to}.csv`;
  }

  function reportCSV(report) {
    return [report.columns, ...report.rows].map(row => row.map(csvEscape).join(',')).join('\n');
  }

  function addSavedReport(report, format) {
    state.savedReports.unshift({
      id: state.nextReportId++,
      type: report.type,
      label: report.title.replace(' Report', ''),
      from: report.from,
      to: report.to,
      generated_at: new Date().toISOString(),
      rows: report.rows.length,
      format
    });
    if (state.savedReports.length > 12) state.savedReports.length = 12;
    saveState();
    renderSavedReports();
  }

  function downloadReport(report, addToHistory = true) {
    downloadFile(reportFileName(report), reportCSV(report));
    if (addToHistory) addSavedReport(report, 'CSV');
    showToast('Report downloaded', `${report.title} saved as CSV.`);
  }

  function buildPrintHTML(report) {
    return `
      <div class="print-doc-head">
        <div><div class="print-brand">BidPro</div><h1>${escapeHTML(report.title)}</h1><p>${formatDate(report.from)} – ${formatDate(report.to)}</p></div>
        <div style="text-align:right"><p>Prepared for</p><strong>${escapeHTML(currentUser().name)}</strong><p>${escapeHTML(currentUser().email)}</p></div>
      </div>
      <div class="print-summary">${report.stats.map(stat => `<div class="print-box"><small>${escapeHTML(stat.label)}</small><strong>${escapeHTML(stat.value)}</strong></div>`).join('')}</div>
      <table class="print-table"><thead><tr>${report.columns.map(column => `<th>${escapeHTML(column)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${report.columns.length}">No records.</td></tr>`}</tbody></table>
      <div class="print-insight"><strong>Performance insights</strong><br>${report.insights.map(escapeHTML).join(' ')}</div>
      <div class="print-foot"><span>Generated by BidPro on ${formatDateTime(new Date())}</span><span>Confidential bid intelligence</span></div>`;
  }

  function printReport(report) {
    byId('printArea').innerHTML = buildPrintHTML(report);
    addSavedReport(report, 'PDF');
    showToast('Print view ready', 'Choose “Save as PDF” in the print dialog.');
    setTimeout(() => window.print(), 180);
  }

  function renderSavedReports() {
    if (!isLoggedIn()) return;
    const list = [...state.savedReports].sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
    byId('savedReportCount').textContent = plural(list.length, 'report');
    byId('savedReports').innerHTML = list.map(report => {
      const meta = REPORT_META[report.type] || REPORT_META.bids;
      const isPdf = report.format === 'PDF';
      return `<div class="saved-report-item">
        <span class="saved-report-icon"><i class="fa-solid ${isPdf ? 'fa-file-pdf' : 'fa-file-csv'}"></i></span>
        <div class="saved-report-info"><strong>${escapeHTML(meta.title)}</strong><small>${formatDateShort(report.from)} – ${formatDateShort(report.to)} · ${report.rows} rows · ${report.format}</small></div>
        <time>${timeAgo(report.generated_at)}</time>
        <button class="row-action-btn" type="button" data-download-report="${report.id}" aria-label="Download report"><i class="fa-solid fa-download"></i></button>
        <button class="row-action-btn" type="button" data-delete-report="${report.id}" aria-label="Delete report"><i class="fa-solid fa-trash-can"></i></button>
      </div>`;
    }).join('') || '<div class="report-empty">No reports generated yet. Build one above.</div>';
  }

  function renderReports() {
    const defaults = defaultReportDates();
    if (!byId('reportFrom').value) byId('reportFrom').value = defaults.from;
    if (!byId('reportTo').value) byId('reportTo').value = defaults.to;
    $$('input[name="reportFormat"]').forEach(input => { input.checked = input.value === ui.reportFormat; });
    renderReportPreview();
    renderSavedReports();
  }

  function downloadSavedReport(reportId) {
    const saved = state.savedReports.find(report => report.id === Number(reportId));
    if (!saved) return;
    const report = buildReport({ type: saved.type, from: saved.from, to: saved.to, summary: true, table: true, insights: true });
    downloadReport(report, false);
  }

  function deleteSavedReport(reportId) {
    const saved = state.savedReports.find(report => report.id === Number(reportId));
    if (!saved) return;
    confirmAction({
      title: 'Delete saved report?',
      message: 'This removes the report entry from your workspace. The downloaded file will not be affected.',
      confirmLabel: 'Delete report',
      onConfirm: () => {
        state.savedReports = state.savedReports.filter(report => report.id !== saved.id);
        saveState();
        renderSavedReports();
        showToast('Report deleted', 'The saved report has been removed.', 'warning');
      }
    });
  }

  /* ---------- Notifications ---------- */
  function renderNotifications() {
    if (!isLoggedIn()) return;
    const list = [...state.notifications].sort((a, b) => new Date(b.time) - new Date(a.time));
    const unread = list.filter(item => !item.read).length;
    const badge = byId('notifBadge');
    badge.textContent = unread;
    badge.dataset.count = String(unread);
    byId('notifSubtitle').textContent = unread ? `${plural(unread, 'unread notification')}` : 'You’re all caught up';
    byId('notificationList').innerHTML = list.slice(0, 8).map(item => {
      const iconClass = ['win', 'outbid', 'auto', 'info'].includes(item.type) ? item.type : 'info';
      const icon = iconClass === 'win' ? 'fa-trophy' : iconClass === 'outbid' ? 'fa-arrow-trend-down' : iconClass === 'auto' ? 'fa-robot' : 'fa-circle-info';
      return `<button class="notification-item ${item.read ? '' : 'unread'}" type="button" data-open-notification="${item.id}">
        <span class="notif-icon ${iconClass}"><i class="fa-solid ${icon}"></i></span>
        <span style="min-width:0"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.message)}</p><time>${timeAgo(item.time)}</time></span>
      </button>`;
    }).join('') || '<div class="report-empty">No notifications yet.</div>';
  }

  function openNotification(notificationId) {
    const item = state.notifications.find(notification => notification.id === Number(notificationId));
    if (!item) return;
    item.read = true;
    saveState();
    renderNotifications();
    updateNavCounts();
    closeAllDropdowns();
    if (item.bid_id && getBid(item.bid_id)) {
      ui.selectedBidId = item.bid_id;
      navigate('bid-detail', { id: item.bid_id });
    } else if (item.auction_id) {
      ui.bidAuctionId = item.auction_id;
      navigate('tracking');
    }
  }

  /* ---------- Modals: profile & terms ---------- */
  function openEditProfileModal() {
    const user = currentUser();
    openModal({
      title: 'Edit profile',
      eyebrow: 'Account settings',
      body: `<form id="editProfileForm" class="modal-form">
        <div class="profile-form-avatar"><span class="avatar">${escapeHTML(initials(user.name))}</span><div><strong>${escapeHTML(user.name)}</strong><small>${escapeHTML(user.plan)} · Member since ${formatDate(user.joined)}</small></div></div>
        <label class="field"><span class="field-label">Full name</span><input type="text" id="editProfileName" value="${escapeHTML(user.name)}" required></label>
        <label class="field"><span class="field-label">Email address</span><input type="email" id="editProfileEmail" value="${escapeHTML(user.email)}" required></label>
        <label class="field"><span class="field-label">Phone <span class="optional">(optional)</span></span><input type="tel" id="editProfilePhone" value="${escapeHTML(user.phone || '')}" placeholder="+1 (555) 000-0000"></label>
        <div class="modal-note"><i class="fa-solid fa-shield-halved"></i><span>This is a frontend demo. Profile details are stored only in your browser.</span></div>
      </form>`,
      footer: `<button class="btn btn-secondary" type="button" data-modal-cancel>Cancel</button><button class="btn btn-primary" type="submit" form="editProfileForm">Save profile</button>`
    });
    byId('editProfileForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = byId('editProfileName').value.trim();
      const email = byId('editProfileEmail').value.trim().toLowerCase();
      const phone = byId('editProfilePhone').value.trim();
      if (name.length < 2) return showToast('Check your name', 'Enter at least two characters.', 'error');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Check your email', 'Enter a valid email address.', 'error');
      const duplicate = state.users.find(item => item.id !== currentUser().id && item.email.toLowerCase() === email);
      if (duplicate) return showToast('Email already in use', 'Choose a different email address.', 'error');
      const oldEmail = currentUser().email;
      Object.assign(currentUser(), { name, email, phone });
      const stored = state.users.find(item => item.email === oldEmail);
      if (stored) Object.assign(stored, { name, email, phone });
      state.bids.forEach(bid => { if (bid.bidder_id === currentUser().id) bid.bidder_name = name; });
      session.email = email;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      saveState();
      setUserChrome();
      closeModal();
      renderCurrentPage();
      showToast('Profile updated', 'Your account details have been saved.');
    });
  }

  function openTermsModal() {
    openModal({
      title: 'Auction terms & demo notice',
      eyebrow: 'BidPro demo',
      body: `<div class="modal-form" style="gap:12px">
        <p style="color:var(--muted);font-size:.75rem;line-height:1.65">BidPro is a frontend-only demonstration project. No real auctions, payments, or bids are processed. All auction and bid data is simulated and stored in your browser’s local storage.</p>
        <div class="modal-note"><i class="fa-solid fa-circle-info"></i><span>Placing a bid updates your local demo workspace only. Clearing browser data resets the application.</span></div>
        <p style="color:var(--muted);font-size:.75rem;line-height:1.65">In a live auction system, every bid would be binding, subject to seller approval, and protected by platform-specific buyer terms. Auto-bid limits are private and would never be exposed to other bidders.</p>
      </div>`,
      footer: `<button class="btn btn-primary" type="button" data-modal-close>I understand</button>`
    });
  }

  /* ---------- Event wiring ---------- */
  function bindEvents() {
    /* Authentication */
    byId('loginTab').addEventListener('click', () => setAuthMode('login'));
    byId('registerTab').addEventListener('click', () => setAuthMode('register'));
    byId('loginForm').addEventListener('submit', (event) => {
      event.preventDefault();
      login(byId('loginEmail').value, byId('loginPassword').value);
    });
    byId('demoLoginBtn').addEventListener('click', () => {
      byId('loginEmail').value = 'alex@bidpro.demo';
      byId('loginPassword').value = 'demo123';
      login('alex@bidpro.demo', 'demo123');
    });
    byId('registerForm').addEventListener('submit', (event) => {
      event.preventDefault();
      register(byId('registerName').value, byId('registerEmail').value, byId('registerPassword').value, byId('registerConfirm').value);
    });
    byId('forgotPassword').addEventListener('click', () => showAuthMessage('Demo accounts use the password “demo123”. Create a new account if you would like a different password.', true));
    $$('[data-password-toggle]').forEach(button => button.addEventListener('click', () => {
      const input = byId(button.dataset.passwordToggle);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.innerHTML = `<i class="fa-regular ${show ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    }));
    byId('authThemeToggle').addEventListener('click', toggleTheme);
    byId('themeToggle').addEventListener('click', toggleTheme);

    /* Navigation and generic actions */
    document.addEventListener('click', (event) => {
      const nav = event.target.closest('[data-nav]');
      if (nav) {
        event.preventDefault();
        navigate(nav.dataset.nav);
        return;
      }
      const placeAuction = event.target.closest('[data-place-auction]');
      if (placeAuction) {
        event.preventDefault();
        const auctionId = Number(placeAuction.dataset.placeAuction);
        if (getAuction(auctionId)) {
          ui.bidAuctionId = auctionId;
          navigate('place-bid');
        }
        return;
      }
      const openBid = event.target.closest('[data-open-bid]');
      if (openBid) {
        event.preventDefault();
        const bidId = Number(openBid.dataset.openBid);
        if (getBid(bidId)) {
          ui.selectedBidId = bidId;
          navigate('bid-detail', { id: bidId });
        }
        return;
      }
      const track = event.target.closest('[data-track-auction]');
      if (track) {
        event.preventDefault();
        const auctionId = Number(track.dataset.trackAuction);
        const tracked = state.trackedAuctions.includes(auctionId);
        state.trackedAuctions = tracked ? state.trackedAuctions.filter(id => id !== auctionId) : [...state.trackedAuctions, auctionId];
        saveState();
        renderCurrentPage();
        showToast(tracked ? 'Tracking disabled' : 'Auction tracked', tracked ? 'You will no longer receive updates for this auction.' : 'You will receive position and closing updates.', tracked ? 'warning' : 'success');
        return;
      }
      const withdraw = event.target.closest('[data-withdraw-bid]');
      if (withdraw) {
        event.preventDefault();
        withdrawBid(Number(withdraw.dataset.withdrawBid));
        return;
      }
      const terms = event.target.closest('[data-show-terms]');
      if (terms) {
        event.preventDefault();
        openTermsModal();
        return;
      }
      const trackFilter = event.target.closest('[data-track-filter]');
      if (trackFilter) {
        ui.trackingFilter = trackFilter.dataset.trackFilter;
        renderTracking();
        return;
      }
      const range = event.target.closest('#spendRangeTabs [data-range]');
      if (range) {
        ui.dashboardRange = Number(range.dataset.range);
        renderDashboardChart();
        return;
      }
      const pageButton = event.target.closest('[data-bid-page]');
      if (pageButton) {
        ui.bidPage = Number(pageButton.dataset.bidPage);
        renderBidListing();
        return;
      }
      const quick = event.target.closest('[data-quick-bid]');
      if (quick) {
        const auction = getAuction(ui.bidAuctionId);
        if (!auction) return;
        const input = byId('bidAmount');
        const value = quick.dataset.quickBid;
        input.value = value === 'min' ? minNextBid(auction) : Number(input.value || 0) + Number(value);
        input.classList.remove('invalid');
        updateBidSummary();
        return;
      }
      const editRule = event.target.closest('[data-edit-autobid]');
      if (editRule) {
        openAutoBidModal(Number(editRule.dataset.editAutobid));
        return;
      }
      const deleteRule = event.target.closest('[data-delete-autobid]');
      if (deleteRule) {
        deleteAutoBidRule(Number(deleteRule.dataset.deleteAutobid));
        return;
      }
      const notification = event.target.closest('[data-open-notification]');
      if (notification) {
        openNotification(Number(notification.dataset.openNotification));
        return;
      }
      const downloadReportBtn = event.target.closest('[data-download-report]');
      if (downloadReportBtn) {
        downloadSavedReport(Number(downloadReportBtn.dataset.downloadReport));
        return;
      }
      const deleteReportBtn = event.target.closest('[data-delete-report]');
      if (deleteReportBtn) {
        deleteSavedReport(Number(deleteReportBtn.dataset.deleteReport));
        return;
      }
      if (event.target.closest('[data-modal-close], [data-modal-cancel]')) {
        closeModal();
        return;
      }
    });

    document.addEventListener('change', (event) => {
      if (event.target.matches('[data-select-bid]')) {
        const id = Number(event.target.dataset.selectBid);
        if (event.target.checked) ui.selectedBidIds.add(id);
        else ui.selectedBidIds.delete(id);
        event.target.closest('tr')?.classList.toggle('bid-selected', event.target.checked);
        updateCompareUI();
        const visible = getFilteredBids().slice((ui.bidPage - 1) * ui.bidPageSize, ui.bidPage * ui.bidPageSize);
        const selectAll = byId('selectAllBids');
        selectAll.checked = visible.length > 0 && visible.every(bid => ui.selectedBidIds.has(bid.id));
        selectAll.indeterminate = visible.some(bid => ui.selectedBidIds.has(bid.id)) && !selectAll.checked;
        return;
      }
      if (event.target.matches('[data-toggle-autobid]')) {
        toggleAutoBidRule(Number(event.target.dataset.toggleAutobid), event.target.checked);
      }
    });

    byId('selectAllBids').addEventListener('change', (event) => {
      const visible = getFilteredBids().slice((ui.bidPage - 1) * ui.bidPageSize, ui.bidPage * ui.bidPageSize);
      visible.forEach(bid => {
        if (event.target.checked) ui.selectedBidIds.add(bid.id);
        else ui.selectedBidIds.delete(bid.id);
      });
      renderBidListing();
    });

    /* Mobile, dropdowns & global controls */
    byId('mobileMenuBtn').addEventListener('click', openSidebar);
    byId('sidebarClose').addEventListener('click', closeSidebar);
    byId('sidebarOverlay').addEventListener('click', closeSidebar);
    byId('notifBtn').addEventListener('click', (event) => {
      event.stopPropagation();
      const panel = byId('notifDropdown');
      const open = panel.classList.contains('open');
      closeAllDropdowns();
      if (!open) {
        panel.classList.add('open');
        byId('notifBtn').setAttribute('aria-expanded', 'true');
      }
    });
    byId('profileBtn').addEventListener('click', (event) => {
      event.stopPropagation();
      const panel = byId('profileDropdown');
      const open = panel.classList.contains('open');
      closeAllDropdowns();
      if (!open) {
        panel.classList.add('open');
        byId('profileBtn').setAttribute('aria-expanded', 'true');
      }
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.dropdown-wrap')) closeAllDropdowns();
    });
    byId('markAllRead').addEventListener('click', () => {
      state.notifications.forEach(item => { item.read = true; });
      saveState();
      renderNotifications();
      showToast('All caught up', 'All notifications marked as read.');
    });
    byId('logoutBtn').addEventListener('click', logout);
    byId('editProfileBtn').addEventListener('click', () => { closeAllDropdowns(); openEditProfileModal(); });
    byId('resetDemoBtn').addEventListener('click', () => {
      closeAllDropdowns();
      confirmAction({
        title: 'Reset the demo workspace?',
        message: 'All bids, auto-bid rules, notifications, and reports will be restored to the original sample data. This cannot be undone.',
        confirmLabel: 'Reset demo data',
        onConfirm: () => {
          localStorage.removeItem(STORAGE_KEY);
          state = seedState();
          saveState();
          session = { email: state.user.email, at: new Date().toISOString() };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          setUserChrome();
          ui.selectedBidId = null;
          ui.bidFilters = { search: '', auction: '', status: '', type: '', sort: 'newest', myBidsOnly: false };
          ui.selectedBidIds.clear();
          navigate('dashboard');
          startTimers();
          showToast('Demo data reset', 'The workspace has been restored to its original state.');
        }
      });
    });

    /* Global search */
    byId('globalSearch').addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const query = event.target.value.trim();
      ui.bidFilters.search = query;
      ui.bidPage = 1;
      navigate('bids');
      if (ui.currentPage === 'bids') {
        syncBidFilterControls();
        renderBidListing();
      }
    });

    /* Dashboard simulation */
    byId('simulateNowBtn').addEventListener('click', () => simulateCompetingBid(null, { manual: true }));
    byId('simulateNowSidebar').addEventListener('click', () => simulateCompetingBid(null, { manual: true }));
    byId('simulationToggle').addEventListener('click', () => {
      state.settings.simulation = !state.settings.simulation;
      saveState();
      updateSimulationUI();
      startSimulation();
      showToast(state.settings.simulation ? 'Live simulation on' : 'Live simulation paused', state.settings.simulation ? 'Competing bids will arrive automatically every 40 seconds.' : 'Automatic competing bids are now paused.', state.settings.simulation ? 'success' : 'warning');
    });

    /* Place bid */
    byId('placeBidForm').addEventListener('submit', (event) => {
      event.preventDefault();
      placeBid();
    });
    byId('bidAuction').addEventListener('change', (event) => setBidAuction(Number(event.target.value)));
    byId('bidAmount').addEventListener('input', () => {
      byId('bidAmount').classList.remove('invalid');
      updateBidSummary();
    });
    byId('bidMax').addEventListener('input', () => {
      byId('bidMax').classList.remove('invalid');
      updateBidSummary();
    });
    $$('input[name="bidType"]').forEach(input => input.addEventListener('change', updateBidFormState));
    byId('placeBidForm').addEventListener('reset', () => {
      setTimeout(() => {
        const auction = getAuction(ui.bidAuctionId);
        if (!auction) return;
        byId('bidAmount').value = minNextBid(auction);
        byId('bidIncrement').value = auction.min_increment;
        byId('bidMax').value = '';
        byId('bidAmount').classList.remove('invalid');
        byId('bidMax').classList.remove('invalid');
        updateBidFormState();
      }, 0);
    });

    /* Bid listing filters */
    byId('bidSearch').addEventListener('input', (event) => {
      ui.bidFilters.search = event.target.value;
      ui.bidPage = 1;
      renderBidListing();
    });
    ['filterAuction', 'filterStatus', 'filterType', 'sortBids'].forEach(id => {
      byId(id).addEventListener('change', (event) => {
        const key = id === 'filterAuction' ? 'auction' : id === 'filterStatus' ? 'status' : id === 'filterType' ? 'type' : 'sort';
        ui.bidFilters[key] = event.target.value;
        ui.bidPage = 1;
        renderBidListing();
      });
    });
    byId('myBidsOnly').addEventListener('change', (event) => {
      ui.bidFilters.myBidsOnly = event.target.checked;
      ui.bidPage = 1;
      renderBidListing();
    });
    byId('resetBidFilters').addEventListener('click', () => {
      ui.bidFilters = { search: '', auction: '', status: '', type: '', sort: 'newest', myBidsOnly: false };
      ui.bidPage = 1;
      renderBidListing();
    });
    byId('clearEmptyFilters').addEventListener('click', () => {
      ui.bidFilters = { search: '', auction: '', status: '', type: '', sort: 'newest', myBidsOnly: false };
      ui.bidPage = 1;
      renderBidListing();
    });
    byId('compareBidsBtn').addEventListener('click', openCompareModal);
    byId('exportBidsBtn').addEventListener('click', exportBidsCSV);

    /* Tracking */
    byId('simulateTrackingBtn').addEventListener('click', () => {
      const positions = userPositions();
      const auction = positions[0]?.auction || activeAuctions()[0];
      simulateCompetingBid(auction?.id, { manual: true });
    });
    byId('trackingNotifyBtn').addEventListener('click', () => {
      openModal({
        title: 'Notification preferences',
        eyebrow: 'Bid tracking',
        body: `<div class="modal-form">
          <label class="check-row"><input type="checkbox" checked disabled><span class="custom-check"></span><span>Outbid alerts — get notified immediately when another bidder overtakes you</span></label>
          <label class="check-row"><input type="checkbox" checked disabled><span class="custom-check"></span><span>Ending soon reminders — 6 hours and 1 hour before an auction closes</span></label>
          <label class="check-row"><input type="checkbox" checked disabled><span class="custom-check"></span><span>Winning confirmations — confirmations when your position improves</span></label>
          <div class="modal-note"><i class="fa-solid fa-circle-info"></i><span>Notifications are simulated in this frontend demo and appear in the bell menu.</span></div>
        </div>`,
        footer: `<button class="btn btn-primary" type="button" data-modal-close>Done</button>`
      });
    });

    /* History filters */
    byId('historySearch').addEventListener('input', (event) => { ui.historyFilters.search = event.target.value; renderHistory(); });
    byId('historyStatus').addEventListener('change', (event) => { ui.historyFilters.status = event.target.value; renderHistory(); });
    byId('historyType').addEventListener('change', (event) => { ui.historyFilters.type = event.target.value; renderHistory(); });
    byId('historyFrom').addEventListener('change', (event) => { ui.historyFilters.from = event.target.value; renderHistory(); });
    byId('historyTo').addEventListener('change', (event) => { ui.historyFilters.to = event.target.value; renderHistory(); });
    byId('resetHistoryFilters').addEventListener('click', () => {
      ui.historyFilters = { search: '', status: '', type: '', from: '', to: '' };
      renderHistory();
    });
    byId('exportHistoryBtn').addEventListener('click', exportHistoryCSV);

    /* Auto-bid */
    byId('newAutoBidBtn').addEventListener('click', () => openAutoBidModal());
    byId('autoBidEngine').addEventListener('change', (event) => {
      state.settings.autoBidEngine = event.target.checked;
      saveState();
      renderAutoBid();
      updateNavCounts();
      showToast(event.target.checked ? 'Auto-bid engine active' : 'Auto-bid engine paused', event.target.checked ? 'Your active rules will protect your positions.' : 'No automatic bids will be placed.', event.target.checked ? 'success' : 'warning');
    });
    byId('simulateAutoBidBtn').addEventListener('click', () => {
      const rule = state.autoBids.find(item => item.status === 'active');
      if (!rule) return showToast('No active rules', 'Create an auto-bid rule before running the test.', 'warning');
      simulateCompetingBid(rule.auction_id, { manual: true });
    });
    ['calcCurrent', 'calcMax', 'calcIncrement'].forEach(id => byId(id).addEventListener('input', updateCalculator));
    byId('useCalculatorBtn').addEventListener('click', () => {
      openAutoBidModal();
      setTimeout(() => {
        if (!byId('autoBidMax')) return;
        byId('autoBidMax').value = Number(byId('calcMax').value) || 8000;
        byId('autoBidIncrement').value = Number(byId('calcIncrement').value) || 100;
      }, 80);
    });

    /* Analytics */
    byId('analyticsRange').addEventListener('change', (event) => {
      ui.analyticsRange = event.target.value === 'all' ? 'all' : Number(event.target.value);
      renderAnalytics();
    });
    byId('analyticsExportBtn').addEventListener('click', exportAnalyticsCSV);

    /* Reports */
    ['reportType', 'reportFrom', 'reportTo', 'reportSummaryCheck', 'reportTableCheck', 'reportInsightsCheck'].forEach(id => {
      byId(id).addEventListener('change', renderReportPreview);
      if (byId(id).tagName === 'INPUT') byId(id).addEventListener('input', renderReportPreview);
    });
    $$('input[name="reportFormat"]').forEach(input => input.addEventListener('change', (event) => {
      ui.reportFormat = event.target.value;
    }));
    byId('generateReportBtn').addEventListener('click', () => {
      const report = buildReport(getReportConfig());
      if (ui.reportFormat === 'pdf') printReport(report);
      else downloadReport(report);
    });
    byId('downloadReportBtn').addEventListener('click', () => downloadReport(buildReport(getReportConfig())));
    byId('printReportBtn').addEventListener('click', () => printReport(buildReport(getReportConfig())));

    /* Routing */
    window.addEventListener('hashchange', handleRoute);

    /* Modal & keyboard */
    byId('modalClose').addEventListener('click', closeModal);
    byId('modalBackdrop').addEventListener('click', (event) => {
      if (event.target === byId('modalBackdrop')) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeModal();
        closeAllDropdowns();
        closeSidebar();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        byId('globalSearch')?.focus();
      }
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    initTheme();
    bindEvents();
    if (isLoggedIn()) {
      byId('authScreen').hidden = true;
      byId('app').hidden = false;
      startApp();
    } else {
      showAuth();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
