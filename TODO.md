# Kitchen Steward — TODO

## Critical (must fix before launch)

### PWA Core
- [x] Create `manifest.json`
- [x] Add app icons: 192x192, 512x512, adaptive icon, favicon
- [x] Add viewport meta tag, theme-color, apple-touch-icon in root layout
- [x] Basic service worker (cache app shell, offline fallback page)

### Legal / GDPR
- [x] Privacy policy page (`/privacy`)
- [x] Terms of service page (`/terms`)
- [x] Cookie/consent banner

### Security
- [x] Verify `.env.local` is gitignored
- [x] Rate limiting middleware on API routes (WhatsApp webhook)
- [x] Verify Vercel `CRON_SECRET` is set and validated

### Error Handling
- [x] Add `not-found.tsx` (404 page)
- [x] Add `global-error.tsx` (fatal error boundary)
- [x] Add `loading.tsx` skeletons for fridge, recipes, analytics

---

## High Priority (ship quality)

### SEO
- [x] Add `robots.txt`
- [x] Add `sitemap.xml`
- [x] Add structured data (JSON-LD)
- [x] Add canonical URLs

### Analytics & Monitoring
- [x] Integrate Vercel Analytics
- [ ] Web Vitals tracking
- [ ] Error tracking service (Sentry or similar)

### Testing
- [ ] Set up Vitest or Jest
- [ ] Unit tests: auth flow, inventory CRUD actions
- [ ] Integration tests: WhatsApp webhook intent parsing
- [ ] E2E tests (Playwright): login, add item, use item, shopping list

---

## Features — Food Management

### Quantity Management
- [x] Quantity adjustment modal with % buttons (25/50/75/100) and +/- controls
- [x] Option to increase quantity/pieces (Use/Aggiungi tab toggle)
- [x] Smarter quantity deduction: AI uses household size, Italian portion tables, unit-aware
- [x] "Ho mangiato" factors in user food profile (portion size, weight, activity, notes)
- [x] Food profile editor in settings (piccola/normale/grande/abbondante + weight + activity + notes)
- [x] Tap item card to open qty modal (simplified card UX)

### Easier Food Removal
- [x] "Ricordami" option on login
- [x] Batch select + delete
- [x] Swipe-to-delete on item cards (mobile)

---

## Features — UX & Navigation

### Dashboard
- [x] Simplified dashboard (expiring items hero, status pills, removed mock data sections)
- [x] Daily challenges: visual grid cards, Italian labels, simplified UX

### Mobile Navigation
- [x] Add "Learn" to bottom nav on mobile
- [x] Move "Settings" to top bar / avatar icon
- [x] Mobile top bar with logo + dark mode toggle + avatar
- [x] Bottom nav with active pill state, frosted glass
- [x] Global FAB: mobile centered + button, desktop floating dark bar

### Sidebar (Desktop)
- [x] Italian labels throughout
- [x] Dark mode toggle
- [x] Cleaner profile section (links to settings)

### Learn Section
- [x] Save button on flashcards, quiz results, food facts
- [x] "Salvati" tab in Learn page

---

## Features — Dark Mode
- [x] Theme provider (light/dark/system) with localStorage persistence
- [x] Anti-flicker inline script
- [x] Olive-branded dark palette
- [x] CSS overrides for all surfaces, tinted backgrounds, borders, text, gradients
- [x] Toggle in sidebar, mobile top bar, and settings
- [x] Settings theme picker (toggle switch)

---

## Features — WhatsApp

### Intelligence
- [x] Conversation memory (last 3 exchanges, 15min TTL)
- [x] Time/meal context awareness (colazione/pranzo/cena)
- [x] Numbered replies work ("la 2" after recipe proposals)
- [x] Smarter AI prompt with fridge categories, expiry warnings, shopping list context
- [x] Exact name matching before fuzzy fallback for USE_ITEMS
- [x] "Ho mangiato fuori" — no subtraction, friendly response

### Meal Check-in
- [x] Cron at 14:00 CET (after lunch) and 21:00 CET (after dinner)
- [x] Asks "Cosa hai mangiato a pranzo/cena?" with expiring items hint
- [x] User replies naturally → AI subtracts from fridge

### Still TODO
- [ ] Move from Twilio sandbox to production WhatsApp Business API
- [ ] Add media support (photo of receipt to add items)

---

## Features — Social & Sharing

### Family / Household
- [ ] Improve household sharing flow (invite link, QR code)
- [x] Per-member activity feed on dashboard (who added/used what, with timestamps)
- [ ] Family notifications when someone adds or finishes an item

---

## Features — Gamification

### Deeper Integration
- [x] Move gamification state from localStorage to Supabase (persist across devices)
- [x] Per-user action tracking in DB (activity_log table with RLS)
- [x] Contextual XP: +15 XP when using items before expiry, +5 normal use, +10 meal logged
- [ ] Gamify daily challenges more (streaks, bonus XP, visual rewards)
- [ ] Weekly household challenge

---

## Features — Notifications

### Push Notifications
- [x] Service worker updated with push + notification click handlers
- [x] Push subscription toggle in settings (Bell on/off)
- [x] Server actions: savePushSubscription, removePushSubscription
- [x] Migration 007: push_subscription column on users table
- [ ] VAPID keys setup (generate + add to env)
- [ ] Cron: send push when food expires in 1-2 days
- [ ] Push notification for daily challenge reminder
- [ ] Push notification when household member adds items

---

## Features — Monetization

### Stripe / Billing
- [ ] Stripe integration
- [ ] 14-day free trial
- [ ] $3.99/month subscription
- [ ] Pricing page
- [ ] Payment webhook handling
- [ ] Manage subscription in Settings

---

## Polish & Performance

### Accessibility
- [ ] ARIA labels on custom modals and sidebar
- [ ] Skip-to-main-content link
- [ ] Keyboard focus trapping in modals
- [ ] Screen reader testing

### Performance
- [ ] Dynamic imports for heavy components (recipes AI, analytics charts)
- [ ] Bundle analyzer setup

### Data Quality
- [ ] Replace mock trend data in analytics with real tracked events
- [ ] Store usage/waste events over time for real charts
- [ ] Historical data for "money saved" calculations

---

## Future / Nice to Have
- [ ] i18n setup (if expanding beyond Italy)
- [ ] Offline-first with IndexedDB sync
- [ ] Barcode scanner to add items
- [ ] Integration with supermarket APIs for prices
- [ ] Recipe sharing between households
