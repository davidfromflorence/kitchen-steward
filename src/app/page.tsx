import { Leaf, BarChart3, Users, MessageCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* ───── Navbar ───── */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 max-w-7xl mx-auto">
        <a href="/" className="flex items-center gap-2">
          <Leaf className="w-7 h-7 text-olive-600" />
          <span className="text-lg font-bold text-slate-900">
            Kitchen Steward
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#impact" className="hover:text-slate-900 transition-colors">
            Impact
          </a>
          <a href="#pricing" className="hover:text-slate-900 transition-colors">
            Pricing
          </a>
        </div>

        <a
          href="/login"
          className="bg-olive-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-olive-700 active:scale-95 transition-all"
        >
          Start Saving Now
        </a>
      </nav>

      {/* ───── Hero ───── */}
      <section className="max-w-7xl mx-auto px-6 md:px-16 pt-12 md:pt-20 pb-16 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-olive-600">
              Eco-Conscious Living
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] text-slate-900">
              Zero Waste,
              <br />
              <span className="italic font-light text-slate-700">
                Max Taste
              </span>
            </h1>
            <p className="mt-6 text-slate-500 text-base md:text-lg max-w-md leading-relaxed">
              Master your kitchen with AI-driven inventory management. Reduce
              food waste and save money with elite precision and eco-conscious
              elegance.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <a
                href="/login"
                className="bg-olive-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-olive-700 active:scale-95 transition-all text-sm"
              >
                Start Saving Now
              </a>
              <a
                href="#features"
                className="border border-slate-300 text-slate-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-white transition-all text-sm"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Right — Hero image */}
          <div className="relative">
            <div className="bg-olive-900 rounded-3xl overflow-hidden aspect-[4/3] flex items-end justify-center">
              {/* Placeholder fridge visual */}
              <div className="w-full h-full bg-gradient-to-b from-olive-800 to-olive-900 flex items-center justify-center">
                <div className="relative w-44 md:w-56">
                  {/* Stylized fridge SVG */}
                  <svg
                    viewBox="0 0 200 320"
                    fill="none"
                    className="w-full drop-shadow-2xl"
                  >
                    {/* Fridge body */}
                    <rect
                      x="20"
                      y="10"
                      width="160"
                      height="300"
                      rx="12"
                      fill="#e8e8e0"
                      stroke="#ccc"
                      strokeWidth="2"
                    />
                    {/* Top door */}
                    <rect
                      x="24"
                      y="14"
                      width="152"
                      height="110"
                      rx="8"
                      fill="#f5f5ef"
                    />
                    {/* Bottom door */}
                    <rect
                      x="24"
                      y="130"
                      width="152"
                      height="176"
                      rx="8"
                      fill="#f0f0ea"
                    />
                    {/* Handle top */}
                    <rect
                      x="155"
                      y="55"
                      width="4"
                      height="30"
                      rx="2"
                      fill="#bbb"
                    />
                    {/* Handle bottom */}
                    <rect
                      x="155"
                      y="200"
                      width="4"
                      height="40"
                      rx="2"
                      fill="#bbb"
                    />
                    {/* Shelves visible */}
                    <rect
                      x="35"
                      y="160"
                      width="130"
                      height="2"
                      fill="#ddd"
                    />
                    <rect
                      x="35"
                      y="210"
                      width="130"
                      height="2"
                      fill="#ddd"
                    />
                    <rect
                      x="35"
                      y="260"
                      width="130"
                      height="2"
                      fill="#ddd"
                    />
                    {/* Items on shelves */}
                    <circle cx="60" cy="185" r="10" fill="#8BC34A" />
                    <circle cx="90" cy="185" r="10" fill="#FF9800" />
                    <circle cx="120" cy="185" r="8" fill="#F44336" />
                    <rect
                      x="50"
                      y="225"
                      width="20"
                      height="25"
                      rx="3"
                      fill="#42A5F5"
                    />
                    <rect
                      x="80"
                      y="228"
                      width="25"
                      height="22"
                      rx="3"
                      fill="#FFEB3B"
                    />
                    <rect
                      x="115"
                      y="225"
                      width="18"
                      height="25"
                      rx="3"
                      fill="#E8F5E9"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute bottom-6 right-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Inventory Health
                </p>
                <p className="text-sm font-bold text-slate-900">
                  98% Efficient
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-20 md:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Smarter Kitchen, Better Planet
            </h2>
            <p className="mt-4 text-slate-500 max-w-lg mx-auto">
              Designed for elite households who value efficiency and
              sustainability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Inventory */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-olive-100 rounded-xl flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6 text-olive-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                AI Inventory
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Real-time tracking of your ingredients with smart expiry alerts.
                Our neural engine predicts your usage patterns.
              </p>
            </div>

            {/* Family Sharing */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-olive-100 rounded-xl flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-olive-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Family Sharing
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Coordinate grocery runs and meal plans with everyone in the
                house. Shared lists that update in real time across all devices.
              </p>
            </div>

            {/* WhatsApp Sync */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-olive-100 rounded-xl flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6 text-olive-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                WhatsApp Sync
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Get shopping lists and recipe ideas sent directly to your
                favorite chat app. No new apps needed for the daily routine.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Impact Stats ───── */}
      <section id="impact" className="py-20 md:py-28 bg-cream">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Food Waste Saved */}
            <div className="bg-cream-dark rounded-3xl p-8 border border-slate-200/60">
              <p className="text-[10px] font-bold text-olive-600 uppercase tracking-[0.2em] mb-4">
                Food Waste Saved
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">35%</span>
                <span className="text-sm font-semibold text-emerald-600">
                  +12%
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Average reduction in household food waste within 3 months.
              </p>
            </div>

            {/* Average Savings */}
            <div className="bg-cream-dark rounded-3xl p-8 border border-slate-200/60">
              <p className="text-[10px] font-bold text-olive-600 uppercase tracking-[0.2em] mb-4">
                Average Savings
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">
                  &pound;1,200
                </span>
                <span className="text-sm font-semibold text-emerald-600">
                  +8%
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Annual savings on unnecessary grocery purchases per household.
              </p>
            </div>

            {/* Active Stewards */}
            <div className="bg-cream-dark rounded-3xl p-8 border border-slate-200/60">
              <p className="text-[10px] font-bold text-olive-600 uppercase tracking-[0.2em] mb-4">
                Active Stewards
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-slate-900">50k+</span>
                <span className="text-sm font-semibold text-emerald-600">
                  +15%
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                Global community committed to a zero-waste culinary lifestyle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="bg-olive-50 rounded-[2rem] py-16 md:py-24 px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              Join the Elite
              <br />
              Movement
            </h2>
            <p className="mt-6 text-slate-500 max-w-md mx-auto">
              Your kitchen, optimized for the planet and your pocket. Start your
              journey towards a zero-waste lifestyle today.
            </p>
            <a
              href="/login"
              className="inline-block mt-8 bg-olive-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-olive-700 active:scale-95 transition-all"
            >
              Get Started Now
            </a>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-3">
              <Leaf className="w-5 h-5 text-olive-600" />
              <span className="font-bold text-slate-900">Kitchen Steward</span>
            </a>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              Elevating the modern household through intelligent stewardship and
              sustainable habits.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#features" className="hover:text-slate-900">
                  AI Inventory
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-900">
                  Family Sharing
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-slate-900">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="hover:text-slate-900">
                  Our Mission
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-slate-900">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Connect
            </h4>
            <div className="flex items-center gap-3 text-slate-500">
              <a href="#" className="hover:text-slate-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17A4.77 4.77 0 0015.37 4c-2.65 0-4.79 2.15-4.79 4.8 0 .37.04.74.13 1.1C7.09 9.7 3.88 7.8 1.67 4.9a4.8 4.8 0 001.48 6.4 4.74 4.74 0 01-2.17-.6v.06c0 2.33 1.65 4.27 3.85 4.71a4.79 4.79 0 01-2.16.08 4.8 4.8 0 004.47 3.33A9.6 9.6 0 010 21.54a13.5 13.5 0 007.36 2.16c8.83 0 13.66-7.32 13.66-13.67l-.02-.62A9.8 9.8 0 0024 6.56a9.57 9.57 0 01-2.54.7z" />
                </svg>
              </a>
              <a href="#" className="hover:text-slate-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
            <p className="mt-6 text-[10px] text-slate-400">
              &copy; 2024 Kitchen Steward. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
