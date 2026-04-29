import { useState, useRef } from 'react';
import Head from 'next/head';

const FORMSPREE = 'https://formspree.io/f/mpqwvlnz';

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

// ── Email Gate ────────────────────────────────────────────────────────────────
function EmailGate({ url, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(FORMSPREE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, url, source: 'AI Scorecard' }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl z-10 p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Unlock Your Results</h3>
        <p className="text-sm text-gray-500 mb-5">Enter your email to see your full AI visibility score and get actionable recommendations.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'See My Score'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">No spam. Unsubscribe any time.</p>
      </div>
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [emailUnlocked, setEmailUnlocked] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const reportRef = useRef(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setEmailUnlocked(false);
    setShowFullReport(false);

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

  const handleUnlock = () => {
    setEmailUnlocked(true);
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

  return (
    <>
      <Head>
        <title>AI Visibility Scorecard — FoundForAI</title>
        <meta name="description" content="Check how visible your business is to AI assistants like ChatGPT, Claude, and Bing Copilot. Get your free AI visibility score in seconds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="AI Visibility Scorecard — FoundForAI" />
        <meta property="og:description" content="Find out if AI assistants can find and recommend your business. Free instant analysis." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Nav */}
        <nav className="no-print border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="https://foundforai.com" className="font-bold text-gray-900 text-sm">
              FoundForAI
            </a>
            <span className="text-xs text-gray-400">AI Visibility Scorecard</span>
          </div>
        </nav>

        <main className="max-w-2xl mx-auto px-4 py-12 pb-20">
          {/* Hero */}
          <div className="text-center mb-10 no-print">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-100">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              Free Instant Analysis
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              Is Your Business<br />
              <span className="text-blue-600">AI-Visible?</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-md mx-auto">
              See if ChatGPT, Claude, and Bing Copilot can find and recommend you — based on official AI standards from Google, Microsoft, OpenAI, and Anthropic.
            </p>
          </div>

          {/* URL Form */}
          <form onSubmit={handleAnalyze} className="no-print mb-6">
            <div className="flex gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
              <div className="flex-1 flex items-center gap-2 pl-3">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="flex-1 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 flex-shrink-0"
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
                  'Analyze Now'
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
          </form>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3 animate-pulse no-print">
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
            <div className="space-y-5">
              {/* Score + Quick Scorecard */}
              <div className="relative">
                <div className={emailUnlocked ? '' : 'pointer-events-none select-none'}>
                  {/* Score summary row */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                      <h2 className="font-bold text-gray-900">Your AI Visibility Score</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{result.url}</p>
                    </div>
                    <ScoreRing score={result.overallScore} grade={result.grade} />
                  </div>

                  <div className={`transition-all duration-300 ${emailUnlocked ? '' : 'blur-md'}`}>
                    <QuickScorecard quickScore={result.quickScore} />
                  </div>
                </div>

                {!emailUnlocked && (
                  <EmailGate url={result.url} onSuccess={handleUnlock} />
                )}
              </div>

              {/* CTA buttons after unlock */}
              {emailUnlocked && (
                <div className="flex flex-col sm:flex-row gap-3 no-print">
                  <button
                    onClick={handleGetReport}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Get Full Report
                  </button>
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
            <div className="mt-12 no-print">
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
        </main>
      </div>
    </>
  );
}
