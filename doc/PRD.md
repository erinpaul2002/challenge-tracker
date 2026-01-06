Got it. I’ve reviewed the uploaded **PM Analysis & MVP Modifications** and I’m aligned with the intent: **tighten MVP, reduce risk, increase validation** without bloating scope.

Below is a **clean, consolidated PRD v1.1** that **incorporates the suggested modifications**, removes redundancy, and is **engineering-ready**. This is the version I’d hand to a dev team and say *“build this.”*

---

# 📄 PRD v1.1 – Live Stream Challenge Tracker

**Status:** MVP – Build Ready
**Owner:** Product
**Target Users:** YouTube FPS Streamers & Moderators

---

## 1. Product Summary

### Problem

Subscriber challenges during live FPS streams are lost in chat chaos, untracked, and invisible to viewers.

### Solution

A **real-time challenge tracker** where moderators update challenge progress live, and viewers see clean, rotating challenge progress via an **OBS browser overlay**.

---

## 2. MVP Goals & Success Metrics

### Product Goals

* Enable real-time challenge tracking during live streams
* Reduce moderator cognitive load
* Create a visible “challenge narrative” for viewers

### Success Metrics (MVP Validation)

| Metric                     | Target                                          |
| -------------------------- | ----------------------------------------------- |
| Streamer setup time        | < 5 minutes                                     |
| Overlay update latency     | < 500ms                                         |
| Avg updates per challenge  | ≥ 3 per stream                                  |
| Streams with ≥5 challenges | ≥ 80% of onboarded streamers                    |
| Overlay uptime             | 99% during stream                               |
| Qualitative success        | 3/5 beta streamers report “saves stream effort” |

---

## 3. User Roles & Permissions

### Streamer

* Owns channel
* Creates challenges
* Manages moderators
* Accesses overlay URL
* Can act as moderator if solo

### Moderator

* Updates challenge & sub-challenge progress
* Marks challenges complete
* Undo last 5 actions

### Viewer

* No login
* Sees overlay on stream only

---

## 4. Authentication & Access

### Auth

* **Magic link (email-based)** via Supabase
* No OAuth
* No password resets during streams

### Overlay Access

* Public **read-only overlay URL**
* Token-based, auto-expires in 7 days
* Regeneratable by streamer

---

## 5. Core Functional Requirements

---

### 5.1 Challenge System

#### Challenge (Parent)

* Title
* Description (rules / constraints)
* Active / inactive
* Auto-completes when all sub-challenges complete (with mod confirmation)

#### Sub-Challenge (Micro)

* Title
* Type:

  * `Numeric` (e.g., 3/10 kills)
  * `Boolean` (done / not done)
* Target value
* Current progress
* Status auto-updates

> **Constraint:** One-level nesting only (no recursive subs)

---

### 5.2 Moderator Dashboard

#### Features

* List of active challenges
* Expandable sub-challenges
* Large `+ / –` buttons
* Boolean toggle for binary challenges
* Undo last update (up to 5)
* Manual “Complete Challenge”
* Quick-add sub-challenge modal

#### UX Requirements

* Keyboard shortcuts supported
* Offline-safe (local queue syncs on reconnect)

---

### 5.3 OBS Overlay (Hero Feature)

#### Integration

* OBS **Browser Source**
* No plugins
* Works in Streamlabs & OBS Studio

#### Display Behavior

* Shows **one challenge at a time**
* Auto-rotates via **round-robin**
* Default rotation: 8s (configurable 5–15s)
* Rotation pauses 15s after any update
* Completed challenges auto-exit rotation

#### Overlay Content

* Challenge title
* Progress bar (derived from sub-challenges)
* 1-line description (optional)
* Highlighted “next sub-goal”

#### Animations

* Smooth progress bar
* Pulse / flash on update
* Fade transition between challenges

#### Empty State

> “No active challenges – drop one in chat 👀”

---

## 6. Non-Functional Requirements

### Performance

* Realtime update latency <500ms
* Overlay auto-recovers from disconnects

### Reliability

* Overlay heartbeat every 5s
* WebSocket with polling fallback

### Security

* Role-based row-level access
* Overlay is strictly read-only
* No cross-stream data access

### Accessibility

* High-contrast overlay mode
* Keyboard navigation for dashboard

---

## 7. Technical Stack (MVP Locked)

* **Frontend:** React + Tailwind
* **Overlay:** Lightweight React / Vanilla JS
* **Backend:** Supabase (Postgres + Realtime + Auth)
* **Hosting:** Vercel
* **Realtime:** Supabase channels
* **Analytics:** Supabase logs + basic event tracking

---

## 8. User Flows (Condensed)

### Streamer

1. Signup → Guided Wizard
2. Create first challenge
3. Add moderator (or skip)
4. Copy overlay URL → OBS

### Moderator

1. Login
2. Auto-load streamer dashboard
3. Update challenges live

### Viewer

* Watches stream → sees rotating challenges

---

## 9. Out of Scope (Hard No for MVP)

* Subscriber submissions
* Rewards / payouts
* Voting / prioritization
* Audio alerts
* Analytics dashboards
* Mobile apps
* Native OBS plugins

---

## 10. Risks & Mitigations

| Risk                  | Mitigation                   |
| --------------------- | ---------------------------- |
| Mod mistakes          | Undo button                  |
| Overlay clutter       | Carousel                     |
| Forgotten overlay URL | Email reminder + setup guide |
| Stream lag            | Realtime + fallback polling  |

---

## 11. MVP Launch Criteria

MVP is considered **done** when:

* Streamer can onboard solo
* Mods can update challenges during a live stream
* Overlay runs uninterrupted for 2+ hours
* At least 3 beta streamers request continued use

---

## 12. Post-MVP Opportunities (Not Now)

* Subscriber challenge submission
* Viewer voting
* Rewards & automation
* Analytics & history
* Priority pinning

---

