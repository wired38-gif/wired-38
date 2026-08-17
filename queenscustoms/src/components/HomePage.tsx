import { useState } from "react";
import { Crown, Instagram, Mail, ShoppingBag, Star, Sparkles, Package, Palette, Heart, ArrowRight, Menu, X } from "lucide-react";

const PRODUCTS = [
  {
    icon: <ShoppingBag size={28} className="text-pink-400" />,
    title: "Custom Apparel",
    desc: "T-shirts, hoodies, matching sets, uniforms — every size from S to 4XL.",
    from: "$25",
    items: ["Custom T-Shirts", "Hoodies & Sweatshirts", "Matching Sets", "Business Uniforms"],
  },
  {
    icon: <Sparkles size={28} className="text-yellow-400" />,
    title: "Accessories & Gifts",
    desc: "Tumblers, jewelry, bags, keychains — personalized and perfect.",
    from: "$20",
    items: ["Custom Tumblers", "Name Jewelry", "Totes & Bags", "Phone Cases"],
  },
  {
    icon: <Star size={28} className="text-pink-400" />,
    title: "Events & Occasions",
    desc: "Birthdays, weddings, baby showers, graduations, memorials.",
    from: "Quote",
    items: ["Birthday Party Kits", "Bridal Packages", "Baby Shower Sets", "Graduation Gifts"],
  },
  {
    icon: <Package size={28} className="text-yellow-400" />,
    title: "Home & Lifestyle",
    desc: "Custom pillows, blankets, wall art, mugs — make it yours.",
    from: "$30",
    items: ["Pillows & Blankets", "Custom Wall Art", "Doormats", "Mugs & Coasters"],
  },
  {
    icon: <Palette size={28} className="text-pink-400" />,
    title: "Digital Services",
    desc: "Logo design, flyers, social media graphics, brand identity.",
    from: "$15",
    items: ["Custom Logo Design", "Flyer Design", "Social Media Graphics", "Brand Packages"],
  },
  {
    icon: <Heart size={28} className="text-yellow-400" />,
    title: "Business Branding",
    desc: "Uniforms, banners, business cards — elevate your brand.",
    from: "Quote",
    items: ["Team Uniforms", "Event Banners", "Business Cards", "Branded Merch"],
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Share Your Vision", desc: "Tell us what you want — colors, text, sizes, quantity. No idea yet? We'll help you create one." },
  { step: "02", title: "Approve Your Proof", desc: "We send a digital mockup within 24–48 hours. One free revision included." },
  { step: "03", title: "Pay & Produce", desc: "Pay in full to kick off production. Standard turnaround: 7–10 business days." },
  { step: "04", title: "Receive Your Royalty", desc: "Your custom items ship with tracking. Local pickup also available." },
];

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0009" }}>
      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "rgba(13,0,9,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(219,39,119,0.2)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={22} className="text-yellow-400" />
            <span className="text-lg font-bold text-white tracking-tight">Queenscustoms<span className="text-pink-500">.shop</span></span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {["products","process","about","contact"].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="text-sm text-slate-400 hover:text-white capitalize transition-colors">
                {id === "process" ? "How It Works" : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            <button
              onClick={() => onNavigate("/admin")}
              className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Admin
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-slate-400 hover:text-white" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3" style={{ borderColor: "rgba(219,39,119,0.2)", background: "rgba(13,0,9,0.98)" }}>
            {["products","process","about","contact"].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-slate-300 hover:text-white py-1.5 capitalize">
                {id === "process" ? "How It Works" : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle,#db2777,transparent)" }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle,#fbbf24,transparent)" }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center relative z-10">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(219,39,119,0.15)", border: "1px solid rgba(219,39,119,0.3)", color: "#f9a8d4" }}>
              <Crown size={12} className="text-yellow-400" /> Premium Custom Goods
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              You Deserve
              <br />
              <span style={{ background: "linear-gradient(135deg,#db2777,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                The Royal
              </span>
              <br />
              Treatment
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
              Custom apparel, accessories, and gifts crafted with love by Mykiesha — because every person deserves something made just for them.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo("products")}
                className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#db2777,#9d174d)", boxShadow: "0 8px 24px rgba(219,39,119,0.3)" }}
              >
                Shop Products <ArrowRight size={16} />
              </button>
              <button
                onClick={() => scrollTo("process")}
                className="flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all"
                style={{ border: "1px solid rgba(219,39,119,0.4)", color: "#f9a8d4" }}
              >
                How It Works
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 mt-10">
              <div className="flex -space-x-2">
                {["👑","✨","💕","🌟"].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm" style={{ borderColor: "#9d174d", background: "#1a0010" }}>{e}</div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">{[0,1,2,3,4].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
                <div className="text-xs text-slate-500 mt-0.5">Loved by hundreds of clients</div>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40" style={{ background: "radial-gradient(circle,#db2777,transparent)" }} />
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden" style={{ border: "3px solid rgba(251,191,36,0.5)", boxShadow: "0 0 60px rgba(219,39,119,0.4)" }}>
                <img
                  src="/queen-avatar.png"
                  alt="Mykiesha — Founder of Queenscustoms.shop"
                  className="w-full h-full object-cover"
                  onError={e => {
                    const t = e.currentTarget;
                    t.style.display = "none";
                    (t.parentElement as HTMLElement).style.display = "flex";
                    (t.parentElement as HTMLElement).style.alignItems = "center";
                    (t.parentElement as HTMLElement).style.justifyContent = "center";
                    (t.parentElement as HTMLElement).innerHTML = '<span style="font-size:80px">👑</span>';
                  }}
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg,#db2777,#9d174d)", boxShadow: "0 4px 16px rgba(219,39,119,0.4)" }}>
                👑 Mykiesha · Founder
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Products ───────────────────────────────────────────────── */}
      <section id="products" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-pink-500 text-sm font-semibold uppercase tracking-widest mb-3">What We Create</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Everything Custom. Everything Royal.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every product is handcrafted to your specifications. No templates — just your vision brought to life.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((p, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all hover:-translate-y-1 group"
                style={{ background: "rgba(219,39,119,0.05)", border: "1px solid rgba(219,39,119,0.15)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(219,39,119,0.1)" }}>
                    {p.icon}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
                    From {p.from}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">{p.desc}</p>
                <ul className="space-y-1">
                  {p.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-1 h-1 rounded-full bg-pink-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section id="process" className="py-20 px-4" style={{ background: "rgba(219,39,119,0.03)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-pink-500 text-sm font-semibold uppercase tracking-widest mb-3">The Process</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Simple, personal, and stress-free. From idea to your door — royally handled.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px z-10" style={{ background: "linear-gradient(90deg,rgba(219,39,119,0.4),transparent)" }} />
                )}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 relative" style={{ background: "linear-gradient(135deg,#db2777,#9d174d)", boxShadow: "0 4px 20px rgba(219,39,119,0.3)" }}>
                  <span className="text-white font-black text-lg">{step.step}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing callout */}
          <div className="mt-14 rounded-2xl p-8 text-center" style={{ background: "rgba(219,39,119,0.08)", border: "1px solid rgba(219,39,119,0.2)" }}>
            <h3 className="text-xl font-bold text-white mb-2">Payment Methods</h3>
            <p className="text-slate-400 mb-4">We make it easy to pay your way.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {["Cash App", "Zelle", "PayPal", "Credit / Debit Card"].map(m => (
                <span key={m} className="px-3 py-1.5 rounded-full text-sm font-semibold text-pink-300" style={{ background: "rgba(219,39,119,0.1)", border: "1px solid rgba(219,39,119,0.3)" }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-pink-500 text-sm font-semibold uppercase tracking-widest mb-3">Meet the Creator</div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">The Queen Behind the Brand</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                Mykiesha — known as <strong className="text-white">Queen</strong> by her community — is a self-taught designer and entrepreneur who believes that every person deserves something made just for them.
              </p>
              <p>
                She founded Queenscustoms.shop to create a space where personalization meets luxury. Her bold pink-and-black aesthetic and crown motif represent a simple but powerful belief: <em className="text-pink-300">everyone deserves to feel like royalty.</em>
              </p>
              <p>
                Every order is handled personally by Mykiesha, ensuring that your piece isn't just a product — it's a statement.
              </p>
            </div>
            <div className="flex gap-4 mt-8">
              <a
                href="https://instagram.com/queenscustoms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#db2777,#9d174d)" }}
              >
                <Instagram size={16} /> @queenscustoms
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "100+", label: "Happy Clients" },
              { value: "500+", label: "Custom Orders" },
              { value: "24hr", label: "Proof Turnaround" },
              { value: "5★", label: "Client Rating" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-6 text-center" style={{ background: "rgba(219,39,119,0.07)", border: "1px solid rgba(219,39,119,0.15)" }}>
                <div className="text-3xl font-black text-white mb-1" style={{ background: "linear-gradient(135deg,#db2777,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / CTA ──────────────────────────────────────────── */}
      <section id="contact" className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-10 sm:p-14 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1a0010 0%,#2d0020 100%)", border: "1px solid rgba(219,39,119,0.3)" }}>
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,#db2777,transparent)" }} />
              <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,#fbbf24,transparent)" }} />
            </div>
            <div className="relative z-10">
              <div className="text-5xl mb-4">👑</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Order?</h2>
              <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                Use the chat button in the corner to ask Queen anything — or click below to start your custom request right now.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://instagram.com/queenscustoms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg,#db2777,#9d174d)", boxShadow: "0 8px 24px rgba(219,39,119,0.3)" }}
                >
                  <Instagram size={16} /> DM on Instagram
                </a>
                <a
                  href="mailto:support@queenscustoms.shop"
                  className="flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl transition-all"
                  style={{ border: "1px solid rgba(219,39,119,0.4)", color: "#f9a8d4" }}
                >
                  <Mail size={16} /> Send an Email
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 text-center border-t" style={{ borderColor: "rgba(219,39,119,0.15)" }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Crown size={16} className="text-yellow-400" />
          <span className="text-sm font-bold text-white">Queenscustoms<span className="text-pink-500">.shop</span></span>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} Queenscustoms.shop · All custom items are final sale · Made with 💕 by Mykiesha</p>
      </footer>
    </div>
  );
}
