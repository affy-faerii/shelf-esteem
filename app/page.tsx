"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import InteractiveDots from "@/components/ui/dots-pattern";
import { Sun, Moon, Search, Sparkles, Copy, RefreshCw, BookOpen, Check, AlertTriangle } from "lucide-react";

type Theme = "dark" | "light";
type Phase = "idle" | "loading" | "done" | "error";

interface Book {
  id: string;
  title: string;
  author: string;
  thumb: string;
  year: string;
}

interface Analysis {
  roast: string;
  personalityType: string;
  personalityDesc: string;
  strengths: string[];
  weaknesses: string[];
  compatibilityWarning: string;
  recommendations: { title: string; author: string; reason: string }[];
}

export default function Home() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dark = theme === "dark";

  const c = {
    // Typography
    text: dark ? "#E8E2D2" : "#1E1B18",
    textMuted: dark ? "#B8B1A4" : "#666056",
    textFaint: dark ? "#7A7468" : "#8E897C",

    // Borders
    border: dark
      ? "rgba(232,226,210,.10)"
      : "rgba(30,27,24,.10)",

    borderHover: dark
      ? "rgba(232,226,210,.20)"
      : "rgba(30,27,24,.20)",

    // Glass surfaces
    surface: dark
      ? "rgba(232,226,210,.04)"
      : "rgba(30,27,24,.03)",

    surfaceHover: dark
      ? "rgba(232,226,210,.08)"
      : "rgba(30,27,24,.06)",

    // Dropdowns & cards
    dropdown: dark
      ? "rgba(18,18,20,.96)"
      : "rgba(248,244,236,.97)",

    card: dark
      ? "rgba(232,226,210,.03)"
      : "rgba(30,27,24,.02)",

    // Book placeholders
    coverBg: dark
      ? "#1B1A1D"
      : "#DDD7C9",
  };

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); setShowDrop(false); return; }
    try {
      const r = await fetch(
        `/api/books?q=${encodeURIComponent(q)}`
      );

      if (!r.ok) {
        throw new Error("Search failed");
      }
      const d = await r.json();
      const items: Book[] = (d.items || []).map((i: any) => ({
        id: i.id,
        title: i.volumeInfo.title || "Unknown",
        author: (i.volumeInfo.authors || ["Unknown"])[0],
        thumb: i.volumeInfo.imageLinks?.smallThumbnail || "",
        year: (i.volumeInfo.publishedDate || "").slice(0, 4),
      }));
      setResults(items);
      setShowDrop(items.length > 0);
    } catch { setShowDrop(false); }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 340);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  const addBook = (book: Book) => {
    if (books.find(b => b.id === book.id) || books.length >= 8) return;
    setBooks(prev => [...prev, book]);
    setQuery(""); setShowDrop(false);
    inputRef.current?.focus();
  };

  const removeBook = (id: string) => {
    const next = books.filter(b => b.id !== id);
    setBooks(next);
    if (next.length < 1) { setPhase("idle"); setAnalysis(null); }
  };

  const analyze = async () => {
    if (books.length < 2) return;

    setPhase("loading");
    setAnalysis(null); // clear previous result

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    const list = books
      .map((b) => `"${b.title}" by ${b.author}`)
      .join(", ");

    try {
      const resp = await fetch("/api/roast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          books: list,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Roast request failed (${resp.status}): ${errText}`);
      }

      const data = await resp.json();

      // Handle API error responses (200 status but {error: "..."})
      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      setPhase("done");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);

    } catch (err) {
      console.error("Analyze error:", err);
      setPhase("error");
      setAnalysis(null);
    }
  };

  const copyResult = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(
      `My Shelf Esteem result: "${analysis.personalityType}"\n\n${analysis.roast}\n\nBooks: ${books.map(b => b.title).join(", ")}`
    ).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const reset = () => { setBooks([]); setPhase("idle"); setAnalysis(null); setQuery(""); };

  const inp: React.CSSProperties = {
    flex: 1,
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 10,
    padding: "13px 16px",
    fontFamily: "'Inter', sans-serif",
    fontSize: 15,
    color: c.text,
    outline: "none",
    transition: "border-color .2s",
    backdropFilter: "blur(4px)",

    boxShadow:
      dark
        ? "0 10px 30px rgba(0,0,0,0.5), 0 20px 80px rgba(0,0,0,0.35)"
        : "0 8px 25px rgba(74,58,22,0.15), 0 18px 50px rgba(74,58,22,0.08)"
  };

  const btn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "13px 18px",
    borderRadius: 10,
    border: `1px solid ${c.border}`,
    background: c.surface,
    color: c.text,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "background .15s",
    whiteSpace: "nowrap",
    backdropFilter: "blur(4px)",

    boxShadow: dark
      ? "0 8px 30px rgba(0,0,0,0.45)"
      : "0 8px 30px rgba(0,0,0,0.12)",

    ...extra,
  });

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: c.text, paddingBottom: 80, transition: "color .35s" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <InteractiveDots theme={theme} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
        style={{
          position: "fixed", top: 20, right: 24, zIndex: 20,
          padding: "9px 16px", borderRadius: 30,
          border: `1px solid ${c.border}`, background: dark ? "rgba(12,12,14,0.75)" : "rgba(245,241,234,0.85)",
          color: c.text, cursor: "pointer", fontFamily: "'DM Mono', monospace",
          fontSize: 12, display: "flex", alignItems: "center", gap: 7,
          backdropFilter: "blur(10px)", transition: "all .25s",
        }}
      >
        {dark ? <Sun size={13} /> : <Moon size={13} />}
        {dark ? "Light" : "Dark"}
      </button>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "72px 0 52px" }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A03F", marginBottom: 18 }}>
            ✦ Literary Taste Analyzer ✦
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(52px, 10vw, 96px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
            Shelf<span style={{ color: "#C8A03F", fontStyle: "italic", display: "block" }}>Esteem</span>
          </h1>
          <p style={{ fontSize: 16, color: c.textMuted, marginTop: 20, lineHeight: 1.65, maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
            Tell us what's on your book shelf.  We'll handle your esteem  ;)
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 36 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A03F", marginBottom: 12, display: "block" }}>
            Select the book you have read
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              style={inp}
              type="text"
              placeholder="Tell us what you've been reading..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length && setShowDrop(true)}
              onKeyDown={e => e.key === "Escape" && setShowDrop(false)}
              autoComplete="off"
            />
            <button style={btn()} onClick={() => search(query)}>
              <Search size={14} /> Search
            </button>
          </div>

          {showDrop && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: c.dropdown, border: `1px solid ${c.border}`,
              borderRadius: 12, overflow: "hidden", zIndex: 99,
              boxShadow: dark ? "0 24px 48px rgba(0,0,0,0.6)" : "0 12px 36px rgba(0,0,0,0.1)",
              backdropFilter: "blur(16px)",
            }}>
              {results.map(book => (
                <div
                  key={book.id}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", cursor: "pointer", borderBottom: `1px solid ${c.border}`, transition: "background .1s" }}
                  onMouseDown={() => addBook(book)}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: 34, height: 48, borderRadius: 4, background: c.coverBg, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {book.thumb ? <img src={book.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLElement).style.display = "none"; }} /> : "📚"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: c.textFaint, marginTop: 2 }}>{book.author}{book.year ? ` · ${book.year}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shelf */}
        {books.length > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#C8A03F" }}>Your shelf</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, background: "rgba(201,168,76,0.15)", color: "#C8A03F", padding: "3px 10px", borderRadius: 20 }}>
                {books.length} book{books.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))", gap: 12, marginBottom: 28 }}>
              {books.map(b => (
                <div key={b.id} style={{ position: "relative" }}
                  onMouseEnter={e => { const btn = e.currentTarget.querySelector(".rm") as HTMLElement; if (btn) btn.style.display = "flex"; }}
                  onMouseLeave={e => { const btn = e.currentTarget.querySelector(".rm") as HTMLElement; if (btn) btn.style.display = "none"; }}
                >
                  <button className="rm" onClick={() => removeBook(b.id)} style={{ display: "none", position: "absolute", top: -7, right: -7, width: 21, height: 21, borderRadius: "50%", background: "#b84e24", color: "#fff", border: "none", fontSize: 13, cursor: "pointer", alignItems: "center", justifyContent: "center", fontWeight: 700, zIndex: 2 }}>×</button>
                  <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: 7, background: c.coverBg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, border: `1px solid ${c.border}` }}>
                    {b.thumb ? <img src={b.thumb} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLElement).style.display = "none"; }} /> : "📚"}
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 6, textAlign: "center", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.title}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button
                disabled={books.length < 2 || phase === "loading"}
                onClick={analyze}
                style={{ padding: "14px 32px", borderRadius: 10, border: "none", background: "#C8A03F", color: "#0c0c0e", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: books.length < 2 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 8, transition: "all .15s", opacity: books.length < 2 ? 0.4 : 1 }}
                onMouseEnter={e => { if (books.length >= 2) { (e.currentTarget as HTMLElement).style.background = "#d9b85c"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#C8A03F"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
              >
                <Sparkles size={15} /> Analyze My Crimes
              </button>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: c.textFaint, marginTop: 10 }}>Select at least 2 books to judge your taste</div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", color: c.textFaint, fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 15, padding: "32px 0" }}>
            Your shelf awaits its first victim…
          </div>
        )}

        {/* Results */}
        {(phase === "loading" || phase === "done" || phase === "error") && (
          <>
            <hr style={{ border: "none", borderTop: `1px solid ${c.border}`, margin: "44px 0" }} />
            <div ref={resultsRef} style={{ 
  background: dark ? "rgba(12,12,14,0.95)" : "rgba(232,226,210,0.90)", 
  borderRadius: 24, 
  padding: "48px 40px",
  position: "relative",
  zIndex: 2,
}}>

              {phase === "loading" && (
                <div style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ width: 38, height: 38, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "#C8A03F", borderRadius: "50%", animation: "spin .75s linear infinite", margin: "0 auto 22px" }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#C8A03F", fontStyle: "italic", marginBottom: 6 }}>Reading between the lines…</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: c.textFaint }}>Consulting the literary oracle</div>
                </div>
              )}

              {phase === "error" && (
                <div style={{ background: "rgba(184,78,36,0.08)", border: "1px solid rgba(184,78,36,0.25)", borderRadius: 10, padding: 20, textAlign: "center", fontSize: 14, color: c.textMuted, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <AlertTriangle size={22} color="#b84e24" />
                  The oracle is temporarily indisposed. Please try again. 
                </div>
              )}

              {phase === "done" && analysis && (
                <div style={{ animation: "fadeUp .4s ease" }}>
                  <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: c.textFaint, textAlign: "center", marginBottom: 6 }}>The oracle has spoken</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#C8A03F", fontStyle: "italic", textAlign: "center", marginBottom: 40 }}>Your Literary Verdict</div>

                  {/* Roast */}
<div style={{ marginBottom: 28 }}>
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: c.textFaint, marginBottom: 10 }}>🔍︎ Shelf Assessment</div>
  <div style={{
    background: dark
      ? "rgba(184,78,36,0.15)"
      : "rgba(184,78,36,0.12)",
    border: `1px solid ${
      dark
        ? "rgba(184,78,36,0.25)"
        : "rgba(184,78,36,0.20)"
    }`,
    borderRadius: 18,
    padding: "36px 42px",
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    lineHeight: 1.8,
    fontWeight: 500,
    color: c.text,
    letterSpacing: "-0.02em",
    maxWidth: "100%",
  }}>
    {analysis.roast}
  </div>
</div>

                  {/* Archetype */}
<div style={{ marginBottom: 28 }}>
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: c.textFaint, marginBottom: 10 }}>◈ Your archetype</div>
  <div style={{ 
    background: dark ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.12)", 
    border: `1px solid ${dark ? "rgba(201,168,76,0.25)" : "rgba(201,168,76,0.22)"}`, 
    borderRadius: 18, 
    padding: "36px 42px" 
  }}>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "#C8A03F", marginBottom: 10 }}>{analysis.personalityType}</div>
    <div style={{ fontSize: 18, color: c.text, lineHeight: 1.7 }}>{analysis.personalityDesc}</div>
  </div>
</div>

{/* Traits */}
<div style={{ marginBottom: 28 }}>
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: c.textFaint, marginBottom: 10 }}>🗲 Traits</div>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
    <div style={{ 
      background: dark ? "rgba(60,100,55,0.15)" : "rgba(60,100,55,0.12)", 
      border: `1px solid ${dark ? "rgba(60,100,55,0.25)" : "rgba(60,100,55,0.22)"}`, 
      borderRadius: 18, 
      padding: "36px 42px" 
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5a8c55", marginBottom: 14 }}>Strengths</div>
      {analysis.strengths.map((s, i) => (
        <div key={i} style={{ fontSize: 18, color: c.text, marginBottom: 8, display: "flex", gap: 10, lineHeight: 1.6 }}>
          <span style={{ color: "#5a8c55", fontSize: 20, lineHeight: 1.1 }}>+</span>{s}
        </div>
      ))}
    </div>
    <div style={{ 
      background: dark ? "rgba(184,78,36,0.15)" : "rgba(184,78,36,0.12)", 
      border: `1px solid ${dark ? "rgba(184,78,36,0.25)" : "rgba(184,78,36,0.22)"}`, 
      borderRadius: 18, 
      padding: "36px 42px" 
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#b84e24", marginBottom: 14 }}>Weaknesses</div>
      {analysis.weaknesses.map((w, i) => (
        <div key={i} style={{ fontSize: 18, color: c.text, marginBottom: 8, display: "flex", gap: 10, lineHeight: 1.6 }}>
          <span style={{ color: "#b84e24", fontSize: 20, lineHeight: 1.1 }}>−</span>{w}
        </div>
      ))}
    </div>
  </div>
</div>

{/* Warning */}
<div style={{ marginBottom: 28 }}>
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: c.textFaint, marginBottom: 10 }}>⚠ Compatibility warning</div>
  <div style={{ 
    background: dark ? "rgba(232,226,210,0.08)" : "rgba(30,27,24,0.06)", 
    border: `1px solid ${c.border}`, 
    borderRadius: 18, 
    padding: "36px 42px", 
    display: "flex", 
    gap: 18 
  }}>
    <div style={{ fontSize: 32, flexShrink: 0 }}>🚨</div>
    <div style={{ fontSize: 18, lineHeight: 1.7, color: c.text }}>{analysis.compatibilityWarning}</div>
  </div>
</div>

{/* Recommendations */}
<div style={{ marginBottom: 28 }}>
  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: c.textFaint, marginBottom: 10 }}>◎ The oracle recommends</div>
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {analysis.recommendations.map((r, i) => (
      <div key={i} style={{ 
        background: dark ? "rgba(232,226,210,0.06)" : "rgba(30,27,24,0.04)", 
        border: `1px solid ${c.border}`, 
        borderRadius: 18, 
        padding: "24px 32px", 
        display: "flex", 
        gap: 16 
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "rgba(201,168,76,0.8)", flexShrink: 0, width: 28, marginTop: 2 }}>0{i + 1}</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: c.text }}>{r.title}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: c.textFaint, marginTop: 4 }}>{r.author}</div>
          <div style={{ fontSize: 16, color: c.textMuted, marginTop: 8, lineHeight: 1.6 }}>{r.reason}</div>
        </div>
      </div>
    ))}
  </div>
</div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 36, flexWrap: "wrap" }}>
                    {[
                      { icon: copied ? <Check size={14} /> : <Copy size={14} />, label: copied ? "Copied!" : "Copy result", action: copyResult },
                      { icon: <RefreshCw size={14} />, label: "Re-analyze", action: analyze },
                      { icon: <BookOpen size={14} />, label: "New shelf", action: reset },
                    ].map(({ icon, label, action }) => (
                      <button key={label} onClick={action}
                        style={btn()}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.surfaceHover; (e.currentTarget as HTMLElement).style.color = c.text; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.surface; (e.currentTarget as HTMLElement).style.color = c.textMuted; }}
                      >
                        {icon} {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}