import * as cheerio from 'cheerio';

export const config = { maxDuration: 20 };

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; FoundForAI-Scorecard/1.0; +https://scorecard.foundforai.com)',
  Accept: 'text/html,application/xhtml+xml,*/*',
};

async function safeFetch(url, timeout = 8000) {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    });
    return res;
  } catch {
    return null;
  }
}

function normalizeUrl(input) {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

function flattenSchemas(data, acc = []) {
  if (!data) return acc;
  if (Array.isArray(data)) {
    data.forEach((d) => flattenSchemas(d, acc));
  } else if (typeof data === 'object') {
    if (data['@type']) acc.push(data);
    if (data['@graph']) flattenSchemas(data['@graph'], acc);
  }
  return acc;
}

function hasType(schemas, type) {
  return schemas.some((s) => {
    const t = s['@type'];
    return t === type || (Array.isArray(t) && t.includes(type));
  });
}

function getSchema(schemas, type) {
  return schemas.find((s) => {
    const t = s['@type'];
    return t === type || (Array.isArray(t) && t.includes(type));
  });
}

function parseRobotsTxt(txt) {
  const lines = txt.split('\n').map((l) => l.trim().toLowerCase());
  const crawlers = {
    googlebot: null,
    bingbot: null,
    'oai-searchbot': null,
    gptbot: null,
    claudebot: null,
    'claude-searchbot': null,
    'claude-user': null,
    'google-extended': null,
  };

  let currentAgents = [];
  for (const line of lines) {
    if (line.startsWith('#') || !line) { currentAgents = []; continue; }
    if (line.startsWith('user-agent:')) {
      const agent = line.replace('user-agent:', '').trim();
      currentAgents.push(agent);
    } else if (line.startsWith('disallow:') || line.startsWith('allow:')) {
      const isDisallow = line.startsWith('disallow:');
      const path = line.replace(/^(dis)?allow:/, '').trim();
      for (const agent of currentAgents) {
        if (agent in crawlers || agent === '*') {
          const key = agent === '*' ? null : agent;
          if (key && crawlers[key] === null) {
            crawlers[key] = isDisallow && path === '/' ? 'blocked' : 'allowed';
          }
          if (agent === '*') {
            Object.keys(crawlers).forEach((k) => {
              if (crawlers[k] === null) {
                crawlers[k] = isDisallow && path === '/' ? 'blocked' : 'allowed';
              }
            });
          }
        }
      }
    } else if (line.startsWith('sitemap:')) {
      crawlers._sitemapInRobots = line.replace('sitemap:', '').trim();
    }
  }

  // null means not mentioned → assume allowed (default)
  Object.keys(crawlers).forEach((k) => {
    if (crawlers[k] === null && !k.startsWith('_')) crawlers[k] = 'allowed';
  });

  return crawlers;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL required' });

  let targetUrl;
  try {
    targetUrl = normalizeUrl(url);
    new URL(targetUrl); // validate
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const origin = new URL(targetUrl).origin;

  // Fetch all resources in parallel
  const [homeRes, robotsRes, llmsRes, sitemapRes] = await Promise.all([
    safeFetch(targetUrl),
    safeFetch(`${origin}/robots.txt`),
    safeFetch(`${origin}/llms.txt`),
    safeFetch(`${origin}/sitemap.xml`).then(async (r) => {
      if (r && r.ok) return r;
      return safeFetch(`${origin}/sitemap_index.xml`);
    }),
  ]);

  // Parse homepage
  let $ = null;
  let schemas = [];
  let isHttps = targetUrl.startsWith('https://');

  if (homeRes && homeRes.ok) {
    try {
      const html = await homeRes.text();
      $ = cheerio.load(html);
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const parsed = JSON.parse($(el).html());
          schemas = schemas.concat(flattenSchemas(parsed));
        } catch {}
      });
    } catch {}
  }

  // Parse robots.txt
  let robotsData = {};
  let robotsTxtExists = false;
  if (robotsRes && robotsRes.ok) {
    robotsTxtExists = true;
    try {
      robotsData = parseRobotsTxt(await robotsRes.text());
    } catch {}
  }

  const llmsTxtExists = !!(llmsRes && llmsRes.ok);
  const sitemapExists = !!(sitemapRes && sitemapRes.ok);

  // ── Schema helpers ──────────────────────────────────────────────────────────
  const orgSchema =
    getSchema(schemas, 'Organization') ||
    getSchema(schemas, 'LocalBusiness') ||
    getSchema(schemas, 'Corporation') ||
    getSchema(schemas, 'Store') ||
    getSchema(schemas, 'Restaurant') ||
    getSchema(schemas, 'Hotel');

  const hasAddress = !!(orgSchema?.address || orgSchema?.streetAddress);
  const hasEmail = !!(
    orgSchema?.email ||
    ($?.('a[href^="mailto:"]').length > 0)
  );
  const hasHours = !!(
    orgSchema?.openingHours ||
    orgSchema?.openingHoursSpecification
  );
  const hasProducts = !!(
    hasType(schemas, 'Product') ||
    hasType(schemas, 'Service') ||
    hasType(schemas, 'ItemList') ||
    orgSchema?.hasOfferCatalog ||
    hasType(schemas, 'Offer')
  );
  const hasFaq = hasType(schemas, 'FAQPage');
  const hasBooking = !!(
    orgSchema?.reservationUrl ||
    schemas.some(
      (s) =>
        s['@type'] === 'ReserveAction' ||
        (s.potentialAction &&
          (s.potentialAction['@type'] === 'ReserveAction' ||
            s.potentialAction['@type'] === 'OrderAction'))
    ) ||
    ($?.('a[href*="calendly"], a[href*="acuity"], a[href*="booking"], a[href*="appointment"], a[href*="schedule"]').length > 0)
  );

  // ── Full report checks ──────────────────────────────────────────────────────

  // 1. Schema.org (30 pts)
  const hasAnyJsonLd = schemas.length > 0;
  const hasOrgSchema = !!orgSchema;
  const hasArticleSchema =
    hasType(schemas, 'Article') ||
    hasType(schemas, 'BlogPosting') ||
    hasType(schemas, 'NewsArticle');
  const hasBreadcrumb = hasType(schemas, 'BreadcrumbList');
  const hasPersonSchema = hasType(schemas, 'Person');
  const hasSameAs = schemas.some((s) => s.sameAs);
  const hasDateModified = schemas.some((s) => s.dateModified || s.datePublished);
  const hasHowTo = hasType(schemas, 'HowTo');

  let schemaScore = 0;
  if (hasAnyJsonLd) schemaScore += 5;
  if (hasOrgSchema) schemaScore += 8;
  if (hasArticleSchema) schemaScore += 5;
  if (hasFaq) schemaScore += 5;
  if (hasBreadcrumb) schemaScore += 3;
  if (hasPersonSchema) schemaScore += 2;
  if (hasSameAs) schemaScore += 2;
  const schemaMax = 30;

  // 2. AI Crawler Config (20 pts)
  const aiSearchBotsAllowed =
    (robotsData['oai-searchbot'] === 'allowed') &&
    (robotsData['claude-searchbot'] === 'allowed');
  const sitemapInRobots = !!robotsData._sitemapInRobots;
  const hasProperAiConfig =
    robotsTxtExists &&
    robotsData['googlebot'] === 'allowed' &&
    robotsData['bingbot'] === 'allowed';

  let crawlerScore = 0;
  if (robotsTxtExists) crawlerScore += 5;
  if (aiSearchBotsAllowed) crawlerScore += 8;
  if (sitemapInRobots) crawlerScore += 4;
  if (hasProperAiConfig) crawlerScore += 3;
  const crawlerMax = 20;

  // 3. llms.txt (10 pts)
  const llmsScore = llmsTxtExists ? 10 : 0;
  const llmsMax = 10;

  // 4. Sitemap (10 pts)
  let sitemapScore = 0;
  if (sitemapExists) sitemapScore += 7;
  if (sitemapInRobots) sitemapScore += 3;
  const sitemapMax = 10;

  // 5. Technical SEO (15 pts)
  const title = $?.('title').first().text().trim() || '';
  const metaDesc = $?.('meta[name="description"]').attr('content') || '';
  const canonical = $?.('link[rel="canonical"]').attr('href') || '';
  const hasOgTags = !!$?.('meta[property="og:title"]').attr('content');

  let techScore = 0;
  if (isHttps) techScore += 5;
  if (title && title.length > 10) techScore += 3;
  if (metaDesc && metaDesc.length > 50) techScore += 3;
  if (canonical) techScore += 2;
  if (hasOgTags) techScore += 2;
  const techMax = 15;

  // 6. Content Quality (10 pts)
  const h1 = $?.('h1').first().text().trim() || '';
  const hasAuthorByline = !!(
    $?.('[rel="author"], .author, [class*="author"], [itemprop="author"]').length > 0 ||
    hasPersonSchema
  );

  let contentScore = 0;
  if (h1) contentScore += 4;
  if (metaDesc) contentScore += 3;
  if (hasAuthorByline) contentScore += 3;
  const contentMax = 10;

  // 7. E-E-A-T (5 pts)
  let eeatScore = 0;
  if (hasPersonSchema || hasAuthorByline) eeatScore += 2;
  if (hasDateModified) eeatScore += 2;
  if (hasSameAs) eeatScore += 1;
  const eeatMax = 5;

  // Total
  const totalScore =
    schemaScore + crawlerScore + llmsScore + sitemapScore + techScore + contentScore + eeatScore;
  const totalMax = schemaMax + crawlerMax + llmsMax + sitemapMax + techMax + contentMax + eeatMax;
  const overallScore = Math.round((totalScore / totalMax) * 100);

  // ── Recommendations ─────────────────────────────────────────────────────────
  const recommendations = [];

  if (!hasAnyJsonLd) recommendations.push({ priority: 'high', text: 'Add JSON-LD structured data — AI systems rely on schema markup to understand and cite your content.' });
  if (!hasOrgSchema) recommendations.push({ priority: 'high', text: 'Add Organization or LocalBusiness schema with your name, url, logo, and contact details.' });
  if (!hasFaq) recommendations.push({ priority: 'high', text: 'Add FAQPage schema — AI assistants frequently pull from FAQ structured data to answer questions directly.' });
  if (!llmsTxtExists) recommendations.push({ priority: 'high', text: 'Create a /llms.txt file at your domain root. This emerging standard gives AI systems a curated, readable overview of your site.' });
  if (!sitemapExists) recommendations.push({ priority: 'high', text: 'Add a sitemap.xml — required for Bing/Copilot grounding eligibility and ensures AI search engines index all your pages.' });
  if (!robotsTxtExists) recommendations.push({ priority: 'medium', text: 'Add a robots.txt file with explicit AI crawler directives for Googlebot, Bingbot, OAI-SearchBot, and Claude-SearchBot.' });
  if (!aiSearchBotsAllowed && robotsTxtExists) recommendations.push({ priority: 'medium', text: 'Explicitly allow OAI-SearchBot and Claude-SearchBot in robots.txt so your content appears in ChatGPT and Claude search answers.' });
  if (!sitemapInRobots && sitemapExists) recommendations.push({ priority: 'medium', text: 'Add a Sitemap: directive to your robots.txt pointing to your sitemap.xml for better AI crawler discovery.' });
  if (!hasBreadcrumb) recommendations.push({ priority: 'medium', text: 'Add BreadcrumbList schema to help AI systems understand your site structure and navigate content hierarchy.' });
  if (!hasAddress && !hasEmail) recommendations.push({ priority: 'medium', text: 'Add business contact details (address, email, phone) to your Organization or LocalBusiness schema for AI local answer eligibility.' });
  if (!metaDesc || metaDesc.length < 50) recommendations.push({ priority: 'medium', text: 'Add a compelling meta description (150–160 chars) — AI systems use these as source snippets for answers.' });
  if (!canonical) recommendations.push({ priority: 'low', text: 'Add canonical link tags to prevent duplicate content confusion in AI grounding systems.' });
  if (!hasDateModified) recommendations.push({ priority: 'low', text: 'Add datePublished and dateModified properties to your content schemas so AI systems know your content is fresh.' });
  if (!hasSameAs) recommendations.push({ priority: 'low', text: 'Add sameAs properties in your schema linking to your Wikipedia, Wikidata, LinkedIn, or social profiles to strengthen entity recognition.' });

  const result = {
    url: targetUrl,
    overallScore,
    grade: overallScore >= 80 ? 'A' : overallScore >= 65 ? 'B' : overallScore >= 50 ? 'C' : overallScore >= 35 ? 'D' : 'F',
    quickScore: {
      businessAddress: { found: hasAddress, label: 'Business address' },
      email: { found: hasEmail, label: 'Email' },
      hours: { found: hasHours, label: 'Hours' },
      productsServices: { found: hasProducts, label: 'Products/Services' },
      faq: { found: hasFaq, label: 'FAQ', highlight: true },
      bookingLink: { found: hasBooking, label: 'Booking Link' },
    },
    sections: [
      {
        id: 'schema',
        title: 'Schema.org Structured Data',
        score: schemaScore,
        max: schemaMax,
        icon: '🗂',
        description:
          'JSON-LD structured data helps AI systems understand your content type, entities, authors, and relationships — directly supporting citation quality in AI answers.',
        checks: [
          { label: 'JSON-LD structured data present', passed: hasAnyJsonLd, detail: hasAnyJsonLd ? `Found ${schemas.length} schema block${schemas.length !== 1 ? 's' : ''}` : 'No JSON-LD detected on homepage' },
          { label: 'Organization or LocalBusiness schema', passed: hasOrgSchema, detail: hasOrgSchema ? `Schema type: ${orgSchema['@type']}` : 'Add Organization or LocalBusiness schema to your homepage' },
          { label: 'Article or BlogPosting schema on content', passed: hasArticleSchema, detail: hasArticleSchema ? 'Article schema detected' : 'Add Article/BlogPosting schema to your content pages' },
          { label: 'FAQPage schema', passed: hasFaq, detail: hasFaq ? 'FAQPage schema found' : 'Add FAQPage schema — AI assistants cite FAQ content heavily' },
          { label: 'BreadcrumbList schema', passed: hasBreadcrumb, detail: hasBreadcrumb ? 'BreadcrumbList found' : 'Add BreadcrumbList to help AI understand your site structure' },
          { label: 'Person/Author schema', passed: hasPersonSchema, detail: hasPersonSchema ? 'Person schema found' : 'Add Person schema on author pages for E-E-A-T signals' },
          { label: 'sameAs entity links', passed: hasSameAs, detail: hasSameAs ? 'sameAs properties found' : 'Link entities to Wikipedia, Wikidata, LinkedIn via sameAs' },
        ],
        recommendation: schemaScore < schemaMax
          ? 'Schema.org markup is the most impactful change you can make for AI visibility. Implement Organization, FAQPage, and Article schemas using JSON-LD format.'
          : 'Excellent schema coverage. Keep markup accurate and ensure it matches visible page content.',
      },
      {
        id: 'crawlers',
        title: 'AI Crawler Configuration',
        score: crawlerScore,
        max: crawlerMax,
        icon: '🤖',
        description:
          'Your robots.txt controls which AI systems can index your content for search answers (OAI-SearchBot, Claude-SearchBot) vs. model training (GPTBot, ClaudeBot). These are independent controls.',
        checks: [
          { label: 'robots.txt file exists', passed: robotsTxtExists, detail: robotsTxtExists ? `${origin}/robots.txt` : 'No robots.txt found — add one with explicit AI crawler directives' },
          { label: 'Googlebot & Bingbot allowed', passed: hasProperAiConfig, detail: hasProperAiConfig ? 'Core search bots allowed' : 'Ensure Googlebot and Bingbot are explicitly allowed' },
          { label: 'OAI-SearchBot allowed (ChatGPT search)', passed: robotsData['oai-searchbot'] === 'allowed', detail: robotsData['oai-searchbot'] === 'allowed' ? 'Allowed' : robotsData['oai-searchbot'] === 'blocked' ? 'BLOCKED — content won\'t appear in ChatGPT search' : 'Not explicitly configured (add: User-agent: OAI-SearchBot / Allow: /)' },
          { label: 'Claude-SearchBot allowed (Claude search)', passed: robotsData['claude-searchbot'] === 'allowed', detail: robotsData['claude-searchbot'] === 'allowed' ? 'Allowed' : robotsData['claude-searchbot'] === 'blocked' ? 'BLOCKED — content won\'t appear in Claude search' : 'Not explicitly configured (add: User-agent: Claude-SearchBot / Allow: /)' },
          { label: 'Sitemap URL declared in robots.txt', passed: sitemapInRobots, detail: sitemapInRobots ? `Sitemap: ${robotsData._sitemapInRobots}` : 'Add Sitemap: https://yourdomain.com/sitemap.xml to robots.txt' },
        ],
        recommendation: !robotsTxtExists
          ? 'Create a robots.txt file that explicitly allows AI search bots (OAI-SearchBot, Claude-SearchBot) and includes your sitemap URL.'
          : !aiSearchBotsAllowed
          ? 'Add explicit Allow directives for OAI-SearchBot and Claude-SearchBot so your content appears in ChatGPT and Claude search results.'
          : 'AI crawler configuration is solid. Consider reviewing your training bot policy (GPTBot, ClaudeBot) based on your content strategy.',
      },
      {
        id: 'llms',
        title: 'llms.txt — AI Content Standard',
        score: llmsScore,
        max: llmsMax,
        icon: '📄',
        description:
          'The /llms.txt file (analogous to robots.txt and sitemap.xml) provides AI systems with a curated, LLM-friendly overview of your site at inference time — when users are actively asking about your business.',
        checks: [
          { label: '/llms.txt file exists', passed: llmsTxtExists, detail: llmsTxtExists ? `${origin}/llms.txt ✓` : 'No /llms.txt found — this emerging standard is increasingly adopted' },
        ],
        recommendation: !llmsTxtExists
          ? `Create a /llms.txt file at ${origin}/llms.txt. Include: H1 with your business name, a blockquote summary, and links to key pages in markdown format. This is one of the fastest wins for AI visibility.`
          : 'llms.txt is present. Ensure it includes your key service pages, FAQ, and contact information in clean markdown format.',
      },
      {
        id: 'sitemap',
        title: 'XML Sitemap',
        score: sitemapScore,
        max: sitemapMax,
        icon: '🗺',
        description:
          'XML sitemaps are required for Bing/Copilot grounding eligibility and signal which pages matter to AI crawlers. Microsoft\'s official guidelines mandate sitemap submission for AI answer inclusion.',
        checks: [
          { label: 'sitemap.xml accessible', passed: sitemapExists, detail: sitemapExists ? `Found at ${origin}/sitemap.xml` : 'No sitemap.xml found — required for Bing Copilot grounding eligibility' },
          { label: 'Sitemap referenced in robots.txt', passed: sitemapInRobots, detail: sitemapInRobots ? 'Sitemap declared in robots.txt' : 'Add Sitemap: directive to robots.txt' },
        ],
        recommendation: !sitemapExists
          ? 'Create and submit an XML sitemap. Most CMS platforms (WordPress, Webflow, Squarespace) have plugins or built-in sitemap generation. Submit to Google Search Console and Bing Webmaster Tools.'
          : 'Sitemap is present. Submit it to Bing Webmaster Tools to improve Copilot grounding eligibility, and consider IndexNow integration for real-time update notifications.',
      },
      {
        id: 'technical',
        title: 'Technical SEO Fundamentals',
        score: techScore,
        max: techMax,
        icon: '⚙️',
        description:
          'Google officially states that standard technical SEO best practices are the foundation for appearing in AI Overviews and AI Mode. These signals directly support AI grounding eligibility.',
        checks: [
          { label: 'HTTPS enabled', passed: isHttps, detail: isHttps ? 'Site uses HTTPS' : 'Migrate to HTTPS — required for trust signals and modern AI indexing' },
          { label: 'Unique, descriptive title tag', passed: !!(title && title.length > 10), detail: title ? `"${title.substring(0, 60)}${title.length > 60 ? '…' : ''}"` : 'No title tag found' },
          { label: 'Meta description present', passed: !!(metaDesc && metaDesc.length > 50), detail: metaDesc ? `${metaDesc.length} chars: "${metaDesc.substring(0, 80)}…"` : 'Meta description missing or too short' },
          { label: 'Canonical URL specified', passed: !!canonical, detail: canonical ? `canonical: ${canonical}` : 'Add <link rel="canonical"> to prevent duplicate content issues' },
          { label: 'Open Graph tags', passed: hasOgTags, detail: hasOgTags ? 'og:title and og:description found' : 'Add Open Graph tags for social and AI preview quality' },
        ],
        recommendation: 'Technical SEO is the baseline requirement for all AI features. Ensure HTTPS, descriptive titles, and canonical URLs are in place before investing in advanced optimizations.',
      },
      {
        id: 'content',
        title: 'Content Quality & Structure',
        score: contentScore,
        max: contentMax,
        icon: '📝',
        description:
          'Google\'s E-E-A-T framework (Experience, Expertise, Authoritativeness, Trustworthiness) directly influences which content AI systems select for answers. Content must be independently verifiable and human-first.',
        checks: [
          { label: 'H1 heading present', passed: !!h1, detail: h1 ? `"${h1.substring(0, 70)}"` : 'No H1 heading found on homepage' },
          { label: 'Meta description provides clear summary', passed: !!(metaDesc && metaDesc.length > 50), detail: metaDesc && metaDesc.length > 50 ? 'Good length' : 'Add a 150–160 character meta description' },
          { label: 'Author/byline information', passed: hasAuthorByline, detail: hasAuthorByline ? 'Author markup detected' : 'Add author bylines and link to author bio pages' },
        ],
        recommendation: 'Ensure key information appears near the top of each page. Focus each URL on a single primary topic. AI systems favor content that completely answers user intent without requiring external context.',
      },
      {
        id: 'eeat',
        title: 'E-E-A-T & Entity Signals',
        score: eeatScore,
        max: eeatMax,
        icon: '🏆',
        description:
          'AI systems use entity signals — who you are, what you do, how you\'re connected to authoritative sources — to determine citation trustworthiness. sameAs links to Wikipedia and Wikidata are particularly powerful.',
        checks: [
          { label: 'Person/author schema with attribution', passed: hasPersonSchema || hasAuthorByline, detail: hasPersonSchema ? 'Person schema found' : hasAuthorByline ? 'Author markup detected in HTML' : 'Add Person schema with sameAs links on author pages' },
          { label: 'datePublished / dateModified on content', passed: hasDateModified, detail: hasDateModified ? 'Content freshness dates found' : 'Add datePublished and dateModified to Article schema' },
          { label: 'sameAs links to authoritative sources', passed: hasSameAs, detail: hasSameAs ? 'sameAs properties found in schema' : 'Add sameAs in Organization schema linking to LinkedIn, Wikipedia, Wikidata' },
        ],
        recommendation: 'Build entity authority by connecting your Organization and Person schemas to external authoritative profiles via sameAs. This directly improves citation probability in AI-generated answers.',
      },
    ],
    recommendations,
    meta: {
      title,
      metaDesc,
      canonical,
      schemasFound: schemas.map((s) => (Array.isArray(s['@type']) ? s['@type'].join(', ') : s['@type'])),
      robotsTxtExists,
      llmsTxtExists,
      sitemapExists,
    },
  };

  res.status(200).json(result);
}
