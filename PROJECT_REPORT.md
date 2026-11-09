# Project Report

## BidPro — A Frontend Bid Management System

| | |
| --- | --- |
| **Project title** | BidPro — Bid Management System |
| **Domain** | Auction / bidding management |
| **Technology** | HTML5, CSS3, vanilla JavaScript (frontend only) |
| **Storage** | Browser `localStorage` |
| **Author** | _Add your name_ |
| **Institution / course** | _Add institution and course_ |
| **Guide** | _Add guide name_ |
| **Academic year** | _Add year_ |

---

## Abstract

Online auctions generate a large amount of time-sensitive information: current prices, competing bids, countdowns, position changes, spending, and outcomes. Managing that information across several auctions is difficult without a dedicated workspace. **BidPro** is a frontend bid management system that brings discovery, bidding, automation, tracking, analytics, and reporting into one responsive interface.

The system is implemented entirely with HTML5, CSS3, and vanilla JavaScript. It uses no backend, database, or external framework; all data is simulated and persisted in the browser's `localStorage`. The application provides secure-looking authentication, a dashboard, bid placement with validation, searchable and filterable bid listings, detailed bid views, tracking timelines, complete bid history, an auto-bid engine with an increment calculator, SVG/CSS analytics, and CSV/PDF report exports. It also includes simulated real-time competing bids, notifications, comparison, global search, and a persisted dark mode.

The result is a fast, self-contained, and visually consistent demonstration of a complete bid management workflow that can be deployed as a static site and used for evaluation, demonstration, or as a foundation for a production system.

**Keywords:** bid management, online auction, frontend, single-page application, vanilla JavaScript, localStorage, data visualisation.

---

## 1. Introduction

### 1.1 Background

Auctions have moved online, and users now participate in many auctions at once. A bidder needs to know what an item is worth, what the minimum next bid is, whether they are winning, how much they have spent, and how their strategy is performing. Without a unified tool, this information is scattered and easy to miss.

### 1.2 Problem statement

Manual tracking of multiple auctions leads to:

- missed outbid notifications and last-minute opportunities;
- inconsistent bidding increments and accidental overbids;
- poor visibility into spending and win rate;
- no easy way to review past decisions or produce reports.

### 1.3 Proposed solution

BidPro provides a single workspace where a bidder can:

- browse active auctions with live prices and countdowns;
- place manual, incremental, maximum, proxy, or auto bids with validation;
- automate responses up to a private maximum;
- track position changes and review complete history;
- analyse spending, win rate, categories, and bid types;
- export CSV reports and print/save PDF reports.

### 1.4 Why a frontend-only approach

The project focuses on interface design, interaction logic, and data presentation. A frontend-only implementation removes server setup, makes the project easy to run and evaluate, and keeps all demonstration data private to the browser. It is also trivially deployable as a static site.

---

## 2. Objectives

1. Design a clean, professional, responsive bid management interface using the green/white/light-green palette.
2. Implement all required modules: Dashboard, Place Bid, Bid Listing, Bid Detail, Bid Tracking, Bid History, Auto-Bid Settings, Bid Analytics, Reports, and Login/Register.
3. Implement the complete bid lifecycle and the required status, type, and result values.
4. Add search, filtering, sorting, pagination, and bid comparison.
5. Provide an auto-bid engine with limits and an increment calculator.
6. Present analytics through charts and generated insights.
7. Support CSV and PDF report exports.
8. Add bonus features: simulated real-time updates, notifications, global search, dark mode, and full responsiveness.
9. Deliver documentation, screenshots, and deployment guidance for submission.

---

## 3. Scope

### 3.1 In scope

- A single-page application with hash-based routing.
- Ten functional screens (nine app pages plus the authentication screen).
- Simulated auction and bid data stored locally.
- All bidding, tracking, analytics, and reporting interactions.
- Responsive layouts for mobile, tablet, and desktop.
- Light and dark themes.

### 3.2 Out of scope

- Real auctions, sellers, payments, or escrow.
- Real user authentication or server-side authorisation.
- Multi-device synchronisation and real concurrency.
- Email, SMS, or push notifications.
- Backend APIs, databases, and admin panels.

---

## 4. System Analysis

### 4.1 Functional requirements

| ID | Requirement |
| -- | ----------- |
| FR-1 | Users can register, sign in, stay signed in, and sign out. |
| FR-2 | The dashboard shows summary statistics, active auctions, and recent activity. |
| FR-3 | Users can place a bid with validation against the minimum next bid. |
| FR-4 | Users can choose a bid type: Manual, Auto, Incremental, Max, or Proxy. |
| FR-5 | Users can search, filter, sort, and paginate bids. |
| FR-6 | Users can open a bid detail with auction context and a full timeline. |
| FR-7 | Users can track position changes for active and closed auctions. |
| FR-8 | Users can review a complete timestamped bid history. |
| FR-9 | Users can create, edit, pause, resume, and delete auto-bid rules. |
| FR-10 | The auto-bid engine responds to competitors without exceeding the maximum. |
| FR-11 | Users can view analytics charts and generated insights. |
| FR-12 | Users can generate, preview, export (CSV), and print (PDF) reports. |
| FR-13 | Users can compare selected bids side by side. |
| FR-14 | Users receive simulated real-time updates and notifications. |
| FR-15 | Users can toggle dark mode and reset demo data. |

### 4.2 Non-functional requirements

| ID | Requirement |
| -- | ----------- |
| NFR-1 | Responsive from 360 px to large desktop widths. |
| NFR-2 | Consistent visual identity (green `#059669`, white `#FFFFFF`, light green `#D1FAE5`). |
| NFR-3 | Fast load and interaction without a build step or backend. |
| NFR-4 | Data persists across reloads. |
| NFR-5 | Accessible semantics, labels, focus states, and keyboard shortcuts. |
| NFR-6 | No console errors or failed asset requests. |
| NFR-7 | Works in current Chrome, Edge, Firefox, and Safari. |

### 4.3 Feasibility study

- **Technical:** all features are achievable with standard browser APIs (`localStorage`, Blob, SVG, CSS Grid).
- **Economic:** no hosting or infrastructure cost beyond static hosting.
- **Operational:** runs in any modern browser; deployment is a file upload.
- **Schedule:** modular single-page design allows incremental implementation and testing.

---

## 5. System Design

### 5.1 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        index.html                        │
│  Auth screen · App shell · 9 page sections · Modals      │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
        ┌───────▼────────┐        ┌────────▼────────┐
        │   style.css    │        │    script.js    │
        │ design system  │        │ state + router  │
        │ layout/themes  │        │ renderers       │
        │ responsive     │        │ engines/exports │
        └────────────────┘        └────────┬────────┘
                                           │
                                  ┌────────▼────────┐
                                  │  localStorage   │
                                  │  state/session  │
                                  │  theme          │
                                  └─────────────────┘
```

The application is a single IIFE. It holds one state object, renders each page from that state, and persists changes to `localStorage`. Hash routing keeps navigation bookmarkable and avoids full page reloads.

### 5.2 Module design

| Module | Responsibility |
| ------ | -------------- |
| Auth | Login, registration, session, logout |
| Dashboard | Stats, auctions, activity, simulation |
| Place Bid | Form, validation, bid creation, summary |
| Bid Listing | Search, filters, sort, pagination, compare |
| Bid Detail | Auction context, position, timeline |
| Tracking | Position changes and tracking stats |
| History | Full record, filters, summary |
| Auto-Bid | Rules, engine, calculator |
| Analytics | Charts, heatmap, insights |
| Reports | Builder, preview, CSV/PDF, saved reports |
| Shared | Toasts, modals, dropdowns, theme, routing |

### 5.3 Data model

**Auction**

```
id, title, category, description, image,
current_price, starting_price, min_increment,
end_date, status, seller, seller_rating,
location, condition, watchers, bid_count, featured
```

**Bid**

```
id, auction_id, bidder_id, bidder_name,
amount, max_amount, increment,
bid_type (manual | auto | incremental | max | proxy),
status   (placed | winning | outbid | won | lost | pending | withdrawn),
result   (winner | runner-up | outbid | withdrawn | ongoing),
note, placed_at
```

**Auto-bid rule**

```
id, user_id, auction_id, max_amount, increment,
status (active | paused | completed), strategy, created_at
```

**Saved report**

```
id, type, label, format, from, to, rows, generated_at
```

### 5.4 Storage keys

| Key | Purpose |
| --- | ------- |
| `bidpro_state_v4` | Full application state |
| `bidpro_session_v4` | Signed-in session |
| `bidpro_theme` | Light/dark preference |

### 5.5 Routing

| Route | Page |
| ----- | ---- |
| `#dashboard` | Dashboard |
| `#place-bid` | Place Bid |
| `#bids` | Bid Listing |
| `#bid-detail?id=<n>` | Bid Detail |
| `#tracking` | Bid Tracking |
| `#history` | Bid History |
| `#auto-bid` | Auto-Bid Settings |
| `#analytics` | Bid Analytics |
| `#reports` | Reports |

A `hashchange` listener parses the route, renders the section, and updates the title and active navigation state.

### 5.6 Key algorithms

**Bid validation**

```
minNext = current_price + min_increment
valid   = amount >= minNext
```

**Bid placement**

```
previousHighest.status = 'outbid'
newBid.status          = 'winning'
auction.current_price  = amount
auction.bid_count     += 1
history.push(entry)
```

**Auto-bid response**

```
if (highest.bidder_id !== me && rule.active && engine.on):
    next = min(auction.current_price + rule.increment, rule.max_amount)
    if next > auction.current_price:
        placeBid(next, type = 'auto')
```

**Increment calculator**

```
possibleBids = floor((max - current) / increment)   // 0 if max <= current
```

**Analytics**

- Spending trend: bids grouped by date, drawn as an SVG polyline.
- Outcomes: counts per result, drawn as an SVG donut using stroke-dasharray.
- Categories/types: proportional CSS bars.
- Heatmap: bids bucketed by weekday and time of day.
- Insights: derived rules (best category, win rate, average bid, auto-bid share).

### 5.7 UI design

- **Palette:** primary `#059669`, white `#FFFFFF`, light green `#D1FAE5`, deep emerald sidebar, amber for pending, rose for loss.
- **Typography:** Plus Jakarta Sans for headings; Inter for body.
- **Components:** cards, stat tiles, status pills, tables, chips, toggles, modals, dropdowns, toasts, timeline, empty states.
- **Layout:** fixed sidebar + sticky topbar on desktop; off-canvas drawer on mobile.
- **Themes:** CSS custom properties switched by `data-theme="light|dark"`.

### 5.8 Security and privacy considerations

This is a demonstration, not a secure system. Passwords are stored in plain text in `localStorage` for demo convenience and must never be handled this way in production. There is no server-side validation, authorisation, encryption, or payment processing. A production system would require hashed credentials, HTTPS, server-side bid validation, concurrency control, audit logs, and secure payment integration.

---

## 6. Implementation

### 6.1 Authentication

The auth screen offers sign-in and registration tabs. Login checks the email/password against the local user list. Registration validates the name, email format, password length (≥ 6), confirmation match, duplicate email, and terms acceptance. Sessions persist unless “Keep me signed in” is unchecked. Logout clears the session and returns to the auth screen.

### 6.2 Dashboard

The dashboard renders greeting text, four summary statistics, a chart, live auction cards with countdowns, and recent activity. A simulation function places competing bids on active auctions, updating the interface and notifications. A manual **Simulate a bid now** button triggers the same path on demand.

### 6.3 Place Bid

The form loads active auctions and updates a live preview when the selection changes. Amount validation shows a toast and marks the field invalid when the bid is below the minimum. Quick-increment chips adjust the amount. Bid type selection reveals maximum and increment fields as needed. A live summary calculates the buyer's premium (5%) and total. On success, the app creates the bid, updates statuses, records history, optionally creates an auto-bid rule, persists state, and routes to the new bid's detail page.

### 6.4 Bid Listing

Bids are filtered by search text, auction, status, type, and ownership, then sorted and paginated (8 per page). The compare action collects up to three selected bids and renders a comparison table in a modal. Tables sit inside a horizontally scrollable wrapper on small screens.

### 6.5 Bid Detail

The detail page shows auction metadata, current price, countdown, the bid's amount/status/type/result/bidder/date, a position explanation, and the full auction timeline with the current highest bid highlighted.

### 6.6 Tracking and History

Tracking groups position changes and highlights winning versus outbid states. History lists every bid with search, auction/status/type filters, summary statistics, and outcome labels.

### 6.7 Auto-Bid

Rules are displayed as cards with maximum, increment, strategy, and status. Users can add or edit rules in a modal, toggle them on/off, or delete them. The engine responds to competitor bids with the smallest winning increment, never above the maximum. The **Test auto-bid** button demonstrates the engine, and the increment calculator estimates the number of bids a limit allows.

### 6.8 Analytics

Analytics computes headline metrics and renders four visualisations: an SVG spending trend, an SVG outcome donut, category bars, and a type-performance list, plus a day/time heatmap and four generated insight tiles. A date-range selector recomputes the view.

### 6.9 Reports

The report builder selects a type, date range, and format, and renders a live preview containing a title, metadata, summary boxes, a data table, and insights. CSV export builds a quoted, UTF-8 CSV and downloads it via a Blob. Print/PDF injects print-only markup into `#printArea`, saves a PDF report entry, and opens the browser print dialog. Saved reports can be deleted.

### 6.10 Bonus features

- Simulated real-time bids on a timer and on demand.
- Toasts and a notification centre with unread counts.
- Global search that routes to a filtered listing.
- Bid comparison modal.
- Persisted dark mode.
- Reset demo data.

---

## 7. Testing

Testing was performed in a Chromium-based browser at desktop, tablet, and mobile widths. Console errors and network requests were monitored throughout.

### 7.1 Test cases and results

| # | Test | Expected | Actual | Status |
| - | ---- | -------- | ------ | ------ |
| 1 | Open app while signed out | Auth screen shown | Auth screen shown | Pass |
| 2 | Sign in with demo credentials | Dashboard loads | Dashboard loaded | Pass |
| 3 | Sign in with wrong password | Error message | “Email or password is incorrect…” | Pass |
| 4 | Register with empty name | Validation message | “Please enter your full name.” | Pass |
| 5 | Register with mismatched passwords | Validation message | “The passwords do not match.” | Pass |
| 6 | Register with valid details | Account created and signed in | Signed in as new user | Pass |
| 7 | Place a bid below minimum | Rejected | “Bid too low — minimum next bid is $7,300.” | Pass |
| 8 | Place a valid bid | Bid created, previous bid outbid, redirect | Bid #29 at $7,400 winning; previous outbid; detail page opened | Pass |
| 9 | Bid listing pagination | 30 bids, 4 pages | “Page 1 of 4”, 8 rows | Pass |
| 10 | Search “rolex” | Only matching bids | 5 of 5 matching | Pass |
| 11 | Filter status “outbid” | Only outbid bids | 13 results, all Outbid | Pass |
| 12 | Compare two bids | Modal with comparison | 3 columns, 7 rows | Pass |
| 13 | Test auto-bid | Competitor then automatic response | Auto bid at $49,500; toast shown | Pass |
| 14 | Create auto-bid rule | Rule added | Rule #5 created and rendered | Pass |
| 15 | Toggle rule | Status changes | Paused, toast shown | Pass |
| 16 | Analytics rendering | Stats, charts, heatmap, insights | 4 stats, 2 SVGs, 5 bars, 5 type rows, 28 heat cells, 4 insights | Pass |
| 17 | CSV download | File downloads and report saved | 1,673-byte CSV with correct quoting/UTF-8 | Pass |
| 18 | Print/PDF | Print view built and dialog invoked | Print markup built; `window.print()` called | Pass |
| 19 | Dark mode | Theme toggles and persists | Toggled; stored in `bidpro_theme` | Pass |
| 20 | Global search “mustang” | Routed to filtered bids | 3 matching bids | Pass |
| 21 | Mark all notifications read | Unread count becomes 0 | Badge changed to 0 | Pass |
| 22 | Mobile 390 px layout | No overflow, drawer works | No overflow; drawer opens/closes | Pass |
| 23 | Tablet 768 px / 1024 px | Correct breakpoints | Drawer at 768; docked sidebar at 1024 | Pass |
| 24 | Reset demo data | Seed state restored | 28 bids, 11 auctions, 4 rules, 1 user | Pass |
| 25 | Console/network health | No errors or 404s | 0 errors, 0 failed requests | Pass |

### 7.2 Responsive verification

| Width | Sidebar | Burger | Horizontal overflow | Result |
| ----- | ------- | ------ | ------------------- | ------ |
| 390 px | Off-canvas | Visible | 0 px | Pass |
| 768 px | Off-canvas | Visible | 0 px | Pass |
| 1024 px | Docked (248 px) | Hidden | 0 px | Pass |
| Desktop | Docked | Hidden | 0 px | Pass |

### 7.3 Observations

- Live simulation adds bids while the app is open; this is intended behaviour and may change prices between visits.
- CSV files correctly escape commas and quotes and preserve non-ASCII characters such as “Hermès”, em dashes, and curly quotes.
- The print view is isolated from the app by print-specific CSS.

---

## 8. Results and Discussion

BidPro delivers a complete, cohesive bidding workflow. The single-page architecture keeps navigation fast, while the state-driven renderers keep every screen consistent after a bid, rule change, or reset. The custom SVG/CSS charts avoid heavy dependencies, and the responsive layout remains usable from small phones to desktops.

The strongest outcomes are:

- **End-to-end bid lifecycle** — validation, placement, status changes, history, tracking, analytics, and reporting all reflect the same state.
- **Automation** — the auto-bid engine demonstrates limit-based competitive behaviour with a clear increment strategy.
- **Data presentation** — charts, heatmaps, insight tiles, and report previews turn raw bids into understandable information.
- **Self-contained delivery** — no server, no build, no database; it can be hosted anywhere and reset safely.

The main trade-off is realism: because everything is client-side, there is no genuine concurrency, security, or persistence beyond one browser. This is appropriate for an interface-focused academic project and is documented clearly.

---

## 9. Limitations

1. Data is stored per browser and is not synchronised across devices.
2. Credentials are demo-only and not securely stored.
3. Bids are simulated; no money changes hands.
4. Real-time updates are timer-based, not server-pushed.
5. New accounts share the demo workspace because the app is single-user.
6. Icons and fonts depend on CDNs.
7. PDF export relies on the browser print dialog.

---

## 10. Future Scope

- Backend API with a relational database and server-side bid validation.
- Real authentication (OAuth/JWT), hashed passwords, and role-based access.
- WebSocket-based live auctions with concurrency-safe bidding.
- Email/SMS/push notifications and watchlists.
- Payment integration, escrow, invoices, and shipping.
- Seller and admin portals with auction approval.
- Advanced analytics, forecasting, and recommendation models.
- Multi-currency, tax, and regional auction rules.
- Progressive Web App support and offline mode.
- Automated test suite (unit, integration, end-to-end) and CI/CD.

---

## 11. Conclusion

BidPro demonstrates how a complete bid management experience can be designed and implemented with only HTML, CSS, and vanilla JavaScript. It covers authentication, bidding, automation, tracking, history, analytics, and reporting in one responsive, theme-aware interface, supported by simulated real-time updates and multiple export options. The project meets its objectives, passes its functional and responsive tests, and provides a solid foundation for a future production system with a real backend.

---

## References

1. MDN Web Docs — HTML, CSS, JavaScript, `localStorage`, Blob, SVG. <https://developer.mozilla.org>
2. W3C — Web Content Accessibility Guidelines (WCAG) 2.1. <https://www.w3.org/WAI/WCAG21/quickref/>
3. Font Awesome documentation. <https://fontawesome.com/docs>
4. Google Fonts — Inter and Plus Jakarta Sans. <https://fonts.google.com>
5. Unsplash — auction photography. <https://unsplash.com>

---

## Appendix A — Demo credentials

```
Email:    alex@bidpro.demo
Password: demo123
```

## Appendix B — File structure

```
index.html          Application markup and page sections
style.css           Design system, layout, themes, responsive and print styles
script.js           State, routing, renderers, engines, exports
assets/             Favicon and local auction images
screenshots/        Submission screenshots
README.md           Setup, features, deployment
PROJECT_REPORT.md   This report
```

## Appendix C — Submission assets

- **Screenshots:** `screenshots/01`–`13`.
- **Demo video:** record a 3–5 minute walkthrough using the script in `README.md`.
- **YouTube:** upload as Unlisted/Public and add the link to the submission form.
- **Live deployment:** publish the static folder with GitHub Pages, Netlify, or Vercel and add the URL to the submission form.
