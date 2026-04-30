import { useState, useRef } from 'react';
import Head from 'next/head';

const FORMSPREE = 'https://formspree.io/f/mpqwvlnz';
const BOOKING_URL = 'https://foundforai.com/book-call';
const QUOTE_EMAIL = 'info@foundforai.com';
const QUOTE_MAILTO = `mailto:${QUOTE_EMAIL}?subject=Done-For-You%20Quote%20Request&body=Hi%20FoundForAI%20team%2C%20I%20just%20ran%20my%20AI%20Visibility%20Report%20and%20would%20like%20a%20done-for-you%20quote.`;

function trackCta(ctaId) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'cta_click', cta_id: ctaId });
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function XIcon() {
  return (
    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color =
    score >= 80 ? '#16a34a' : score >= 65 ? '#2563eb' : score >= 50 ? '#f59e0b' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        <circle
          cx="65" cy="65" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="65" y="60" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="65" y="82" textAnchor="middle" dominantBaseline="middle" fontSize="13" fill="#94a3b8">
          / 100
        </text>
      </svg>
      <span
        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: color + '20', color }}
      >
        Grade {grade}
      </span>
    </div>
  );
}

// ── Section Score Bar ─────────────────────────────────────────────────────────
function SectionBar({ score, max }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-blue-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-600 w-14 text-right">{score}/{max}</span>
    </div>
  );
}

// ── Quick Scorecard ───────────────────────────────────────────────────────────
function QuickScorecard({ quickScore }) {
  const items = Object.values(quickScore);
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Key Features</span>
        <span className="text-sm font-semibold text-blue-600">AI-visible</span>
      </div>
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex items-center justify-between px-6 py-4 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}
        >
          <span className={`text-sm font-medium ${item.highlight ? 'text-blue-600' : 'text-gray-700'}`}>
            {item.label}
          </span>
          {item.found ? <CheckIcon /> : <XIcon />}
        </div>
      ))}
    </div>
  );
}

// ── Post-Report CTA ───────────────────────────────────────────────────────────
function PostReportCTA() {
  const trustBullets = [
    'No pitch — we review your report live',
    'Custom 30-day fix roadmap',
    '15 minutes, free, no credit card',
  ];

  return (
    <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-6 sm:p-8 no-print">
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
        You&apos;ve got your roadmap. Want us to handle the fixes?
      </h3>
      <p className="text-sm sm:text-base text-gray-500 mt-2 leading-relaxed">
        We&apos;ll walk you through your report live and give you a custom 30-day plan to get cited by ChatGPT, Gemini, Perplexity, and Claude.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener"
          onClick={() => trackCta('post_report_book_call')}
          aria-label="Book a free 15-minute AI Visibility Review"
          className="sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl text-sm transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Walk Me Through My Report — Book Free 15-Min Review
        </a>
        <a
          href={QUOTE_MAILTO}
          onClick={() => trackCta('post_report_quote_email')}
          aria-label="Email FoundForAI for a done-for-you quote"
          className="sm:flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-5 rounded-xl text-sm border border-gray-200 transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Email Me a Done-For-You Quote
        </a>
      </div>

      <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        {trustBullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Full Report ───────────────────────────────────────────────────────────────
function FullReport({ data }) {
  const priorityColor = { high: 'bg-red-50 text-red-700 border-red-200', medium: 'bg-amber-50 text-amber-700 border-amber-200', low: 'bg-blue-50 text-blue-700 border-blue-200' };
  const priorityLabel = { high: 'High priority', medium: 'Medium', low: 'Low' };

  return (
    <div id="full-report" className="space-y-6 mt-8">
      {/* Report Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 print-break">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Full AI Visibility Report</h2>
            <p className="text-sm text-gray-500 mt-1">{data.url}</p>
          </div>
          <ScoreRing score={data.overallScore} grade={data.grade} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'Schema.org', score: data.sections[0].score, max: data.sections[0].max },
            { label: 'AI Crawlers', score: data.sections[1].score, max: data.sections[1].max },
            { label: 'Technical SEO', score: data.sections[4].score, max: data.sections[4].max },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-gray-900">{Math.round((s.score / s.max) * 100)}%</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Schema Found */}
      {data.meta.schemasFound.length > 0 && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 px-5 py-4">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Detected Schema Types</p>
          <div className="flex flex-wrap gap-2">
            {data.meta.schemasFound.map((t, i) => (
              <span key={i} className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {data.sections.map((section) => (
        <div key={section.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{section.icon}</span>
                  <h3 className="font-bold text-gray-900">{section.title}</h3>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{section.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <SectionBar score={section.score} max={section.max} />
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {section.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                <div className="mt-0.5">{check.passed ? <CheckIcon /> : <XIcon />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{check.label}</p>
                  {check.detail && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{check.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">Recommendation: </span>
              {section.recommendation}
            </p>
          </div>
        </div>
      ))}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Action Plan</h3>
            <p className="text-xs text-gray-500 mt-0.5">Prioritized steps to improve your AI visibility score</p>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${priorityColor[rec.priority]}`}>
                  {priorityLabel[rec.priority]}
                </span>
                <p className="text-sm text-gray-700">{rec.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post-Report Conversion CTA */}
      <PostReportCTA />

      {/* Footer */}
      <div className="text-center py-4 no-print">
        <p className="text-xs text-gray-400">
          Report generated by{' '}
          <a href="https://foundforai.com" className="text-blue-500 hover:underline">FoundForAI</a>
          {' '}· Standards sourced from Google, Bing, OpenAI, Anthropic, schema.org, and llms.txt
        </p>
      </div>
    </div>
  );
}

// ── Measured-Against Logos ────────────────────────────────────────────────────
function ModelBadge({ tag, name, bg, fg }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[10px] font-bold tracking-wide"
        style={{ background: bg, color: fg }}
      >
        {tag}
      </span>
      <span className="text-base font-semibold text-gray-700">{name}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [findFor, setFindFor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const reportRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim() || !email.trim() || !findFor.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShowFullReport(false);

    // Fire-and-forget Formspree submission so the lead is captured even if analysis fails.
    fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        website: url,
        email,
        findFor,
        source: 'AI Scorecard',
      }),
    }).catch(() => {});

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to analyze that URL. Please check and try again.');
    }
    setLoading(false);
  };

  const handleGetReport = () => {
    setShowFullReport(true);
    setTimeout(() => {
      reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePrint = () => {
    window.print();
  };

  const formReady = url.trim() && email.trim() && findFor.trim();

  return (
    <>
      <Head>
        <title>AI Visibility Scorecard — FoundForAI</title>
        <meta name="description" content="See exactly how ChatGPT, Gemini, Perplexity, and Claude describe — or ignore — your business. Free instant AI visibility report." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Is AI Recommending Your Business? — FoundForAI" />
        <meta property="og:description" content="Find out if ChatGPT, Gemini, Perplexity, and Claude can find and recommend you. Free instant analysis." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Nav */}
        <nav className="no-print border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="https://foundforai.com" className="font-bold text-gray-900 text-sm">
              FoundForAI
            </a>
            <span className="text-xs text-gray-400">AI Visibility Scorecard</span>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-12 sm:py-20 pb-20">
          {/* Hero */}
          <div className="text-center no-print">
            <div className="inline-flex items-center bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-blue-100">
              The New Way to Be Discovered
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
              Is AI Recommending<br />
              Your Business?
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              See exactly how ChatGPT, Gemini, Perplexity, and Claude describe — or ignore — your business. Free report, no credit card.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAnalyze} className="no-print mt-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourbusiness.com"
                className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent md:border-r md:border-gray-100"
                disabled={loading}
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent md:border-r md:border-gray-100"
                disabled={loading}
                required
              />
              <input
                type="text"
                value={findFor}
                onChange={(e) => setFindFor(e.target.value)}
                placeholder="What should AI find you for?"
                className="flex-1 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                disabled={loading}
                required
              />
              <button
                type="submit"
                disabled={loading || !formReady}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing…
                  </>
                ) : (
                  'Get my free report'
                )}
              </button>
            </div>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 border border-red-100">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-5 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <span className="text-gray-400">✓</span> Instant on-page report
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-gray-400">✓</span> Save as PDF
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-gray-400">✓</span> No credit card
              </span>
            </div>
          </form>

          {/* Measured Against */}
          {!result && !loading && (
            <div className="no-print mt-16 sm:mt-24">
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
                <span className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
                  Measured Against
                </span>
                <ModelBadge tag="GPT" name="ChatGPT" bg="#86efac" fg="#065f46" />
                <ModelBadge tag="GEM" name="Gemini" bg="#a5b4fc" fg="#1e3a8a" />
                <ModelBadge tag="PPX" name="Perplexity" bg="#a5f3fc" fg="#155e75" />
                <ModelBadge tag="CLD" name="Claude" bg="#fdba74" fg="#7c2d12" />
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-3 animate-pulse no-print mt-10">
                <div className="h-12 bg-gray-100 rounded-2xl" />
                <div className="h-12 bg-gray-100 rounded-2xl" />
                <div className="h-12 bg-gray-100 rounded-2xl" />
                <div className="h-12 bg-gray-100 rounded-2xl" />
                <div className="h-12 bg-gray-100 rounded-2xl" />
                <div className="h-12 bg-gray-100 rounded-2xl" />
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="space-y-5 mt-10">
                {/* Score summary row */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div>
                    <h2 className="font-bold text-gray-900">Your AI Visibility Score</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{result.url}</p>
                  </div>
                  <ScoreRing score={result.overallScore} grade={result.grade} />
                </div>

                <QuickScorecard quickScore={result.quickScore} />

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3 no-print">
                  {!showFullReport && (
                    <button
                      onClick={handleGetReport}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Get Full Report
                    </button>
                  )}
                  {showFullReport && (
                    <button
                      onClick={handlePrint}
                      className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm border border-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download PDF
                    </button>
                  )}
                </div>

                {!showFullReport && (
                  <p className="text-center text-sm text-gray-500 no-print -mt-1">
                    Prefer to talk it through?{' '}
                    <a
                      href={BOOKING_URL}
                      target="_blank"
                      rel="noopener"
                      onClick={() => trackCta('post_score_book_call_link')}
                      className="text-gray-500 hover:underline hover:text-gray-700 focus:outline-none focus:underline"
                    >
                      Book a free 15-min AI Visibility Review &rarr;
                    </a>
                  </p>
                )}

                {/* Full Report */}
                {showFullReport && (
                  <div ref={reportRef}>
                    <FullReport data={result} />
                  </div>
                )}
              </div>
            )}

            {/* How it works */}
            {!result && !loading && (
              <div className="mt-20 no-print">
                <p className="text-center text-xs font-semibold tracking-widest text-gray-400 uppercase mb-6">What We Check</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: '🗂', label: 'Schema.org Data' },
                    { icon: '🤖', label: 'AI Crawler Access' },
                    { icon: '📄', label: 'llms.txt' },
                    { icon: '🗺', label: 'XML Sitemap' },
                    { icon: '⚙️', label: 'Technical SEO' },
                    { icon: '🏆', label: 'E-E-A-T Signals' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">
                  Standards sourced directly from Google, Microsoft, OpenAI, Anthropic, schema.org, and llms.txt
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
