# Kitchen Steward — TODO

## Critical (must fix before launch)

### PWA Core
- [x] Create `manifest.json` (name, short_name, icons, theme_color, background_color, display: standalone)
- [x] Add app icons: 192x192, 512x512, adaptive icon, favicon
- [x] Add viewport meta tag, theme-color, apple-touch-icon in root layout
- [x] Basic service worker (cache app shell, offline fallback page)

### Legal / GDPR
- [x] Privacy policy page (`/privacy`)
- [x] Terms of service page (`/terms`)
- [ ] Cookie/consent banner

### Security
- [x] Verify `.env.local` is gitignored — if tracked, rotate all keys
- [x] Rate limiting middleware on API routes (WhatsApp webhook, Gemini calls)
- [x] Verify Vercel `CRON_SECRET` is set and validated

### Error Handling
- [x] Add `not-found.tsx` (404 page)
- [x] Add `global-error.tsx` (fatal error boundary)
- [x] Add `loading.tsx` skeletons for heavy routes (fridge, recipes, analytics)

---

## High Priority (ship quality)

### SEO
- [x] Add `robots.txt`
- [x] Add `sitemap.xml`
- [x] Add structured data (JSON-LD: Organization, WebApp)
- [ ] Add canonical URLs

### Analytics & Monitoring
- [ ] Integrate Vercel Analytics or PostHog
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
- [x] Option to increase quantity/pieces (not just decrease)
- [x] Smarter quantity deduction: AI uses household size, Italian portion tables, and unit-aware subtraction
- [x] "Ho mangiato" factors in household member count for better estimates

### Easier Food Removal
- [x] "Ricordami" option on login
- [x] Batch select + delete: tap to select multiple items, then "Elimina selezionati" (for food you ate entirely)
- [ ] Quick swipe-to-delete on item cards (mobile)
- [ ] When marking partial use, show remaining quantity clearly (already done via qty modal)

---

## Features — UX & Navigation

### Dashboard
- [ ] Improve dashboard layout and organization (clearer hierarchy, less clutter)
- [x] Daily challenges: simplified UX (visual grid cards, clearer tap targets, Italian labels)

### Mobile Navigation
- [x] Add "Learn" to bottom nav on mobile
- [x] Move "Settings" to top bar / profile icon on mobile (not in bottom nav)
- [x] Mobile top bar with logo + Settings icon

### Learn Section
- [x] Allow saving interesting flashcards/quiz results for later review
- [x] "Salvati" tab in Learn page to revisit saved cards

---

## Features — Social & Sharing

### Family / Household
- [ ] Improve household sharing flow (invite link, QR code)
- [ ] Per-member activity feed (who added/used what)
- [ ] Family notifications when someone adds or finishes an item

---

## Features — Gamification

### Deeper Integration
- [ ] Move gamification state from localStorage to Supabase (persist across devices)
- [ ] Per-user action tracking in DB (for real leaderboard, not pseudo-scored)
- [ ] Gamify daily challenges more (streaks, bonus XP, visual rewards)
- [ ] Contextual XP: earn XP when using items before expiry, lose streak when food expires
- [ ] Weekly household challenge (e.g., "zero waste this week")

---

## Features — Notifications

### Push Notifications
- [ ] Service worker setup for Web Push API
- [ ] Request notification permission (with good UX timing, not on first visit)
- [ ] Push notification when food is about to expire (1-2 days before)
- [ ] Push notification for daily challenge reminder
- [ ] Push notification when household member adds items

### WhatsApp (existing, improvements)
- [ ] Move from Twilio sandbox to production WhatsApp Business API
- [ ] Add media support (photo of receipt to add items)
- [ ] Conversation context (remember last few messages)

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
- [ ] Image optimization if/when images are added

### Data Quality
- [ ] Replace mock trend data in analytics with real tracked events
- [ ] Store usage/waste events over time for real charts
- [ ] Historical data for "money saved" calculations

---

## Future / Nice to Have
- [ ] Dark mode
- [ ] i18n setup (if expanding beyond Italy)
- [ ] Offline-first with IndexedDB sync
- [ ] Barcode scanner to add items
- [ ] Integration with supermarket APIs for prices
- [ ] Recipe sharing between households
