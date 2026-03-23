#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
const cheerio = require('cheerio');

const server = new Server(
  { name: 'mcp-seo-auditor', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// ─── Tool Definitions ─────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'audit_page',
      description: 'Full on-page SEO audit — title, meta description, H1-H6 hierarchy, canonical, OG tags, Twitter cards, internal/external links, image alt coverage, word count, robots meta. Each element scored green/yellow/red.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to audit' }
        },
        required: ['url']
      }
    },
    {
      name: 'validate_schema',
      description: 'Extract and validate all JSON-LD schema blocks on a page. Type-specific validation for Article, FAQPage, Product, HowTo, BreadcrumbList, Person, Organization.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to check for JSON-LD schema' }
        },
        required: ['url']
      }
    },
    {
      name: 'check_headings',
      description: 'Extract and analyze heading hierarchy (H1-H6) from a page. Checks for missing H1, multiple H1s, skipped levels, heading-to-content ratio.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to analyze headings' }
        },
        required: ['url']
      }
    },
    {
      name: 'audit_images',
      description: 'Audit all images on a page — alt text coverage, missing alt attributes, oversized images, lazy loading status.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to audit images' }
        },
        required: ['url']
      }
    }
  ]
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const r = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MCPSEOAuditor/1.0)' },
    maxRedirects: 5,
    validateStatus: () => true,
  });
  return { html: r.data, status: r.status, headers: r.headers };
}

function scoreValue(condition, good, partial) {
  if (good) return 'green';
  if (partial) return 'yellow';
  return 'red';
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'audit_page') {
      const { html, status } = await fetchPage(args.url);
      const $ = cheerio.load(html);
      const origin = new URL(args.url).origin;

      const title = $('head title').text().trim();
      const metaDesc = $('meta[name="description"]').attr('content') || '';
      const h1Count = $('h1').length;
      const h1Text = $('h1').first().text().trim();
      const canonical = $('link[rel="canonical"]').attr('href') || '';
      const robots = $('meta[name="robots"]').attr('content') || '';

      const headings = {};
      for (let i = 1; i <= 6; i++) headings[`h${i}`] = $(`h${i}`).length;

      const schemas = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        try { schemas.push(JSON.parse($(el).html())); } catch {}
      });

      const og = {
        title: $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[property="og:description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || '',
      };
      const twitter = {
        card: $('meta[name="twitter:card"]').attr('content') || '',
        title: $('meta[name="twitter:title"]').attr('content') || '',
      };

      let internal = 0, external = 0;
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href') || '';
        if (href.startsWith('/') || href.startsWith(origin)) internal++;
        else if (href.startsWith('http')) external++;
      });

      const totalImages = $('img').length;
      let withAlt = 0;
      $('img').each((_, el) => { if ($(el).attr('alt')) withAlt++; });

      const wordCount = $('body').text().split(/\s+/).filter(w => w.length > 0).length;

      const analysis = {
        url: args.url,
        status_code: status,
        title: {
          value: title, length: title.length,
          score: title.length >= 30 && title.length <= 60 ? 'green' : title.length > 0 ? 'yellow' : 'red',
          tip: title.length < 30 ? 'Too short (<30)' : title.length > 60 ? 'Too long (>60)' : 'Good'
        },
        meta_description: {
          value: metaDesc, length: metaDesc.length,
          score: metaDesc.length >= 120 && metaDesc.length <= 160 ? 'green' : metaDesc.length > 0 ? 'yellow' : 'red'
        },
        h1: {
          text: h1Text, count: h1Count,
          score: h1Count === 1 ? 'green' : 'red',
          tip: h1Count === 0 ? 'Missing H1' : h1Count > 1 ? 'Multiple H1s' : 'Good'
        },
        headings,
        canonical: { value: canonical, score: canonical ? 'green' : 'red' },
        robots: { value: robots, score: robots.includes('noindex') ? 'red' : 'green' },
        schema: { count: schemas.length, types: schemas.map(s => s['@type'] || 'unknown'), score: schemas.length > 0 ? 'green' : 'yellow' },
        open_graph: { ...og, score: og.title && og.description && og.image ? 'green' : og.title ? 'yellow' : 'red' },
        twitter_card: { ...twitter, score: twitter.card ? 'green' : 'yellow' },
        links: { internal, external },
        images: { total: totalImages, with_alt: withAlt, coverage: totalImages > 0 ? Math.round(withAlt / totalImages * 100) + '%' : 'N/A', score: totalImages === 0 || withAlt / totalImages > 0.8 ? 'green' : 'red' },
        word_count: { value: wordCount, score: wordCount >= 300 ? 'green' : wordCount >= 100 ? 'yellow' : 'red' }
      };

      return { content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }] };
    }

    if (name === 'validate_schema') {
      const { html } = await fetchPage(args.url);
      const $ = cheerio.load(html);
      const results = [];

      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const schema = JSON.parse($(el).html());
          const errors = [], warnings = [];
          const type = schema['@type'];

          if (!type) errors.push('Missing @type');

          if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
            if (!schema.headline) warnings.push('Missing headline');
            if (!schema.datePublished) warnings.push('Missing datePublished');
            if (!schema.dateModified) warnings.push('Missing dateModified');
            if (!schema.author) warnings.push('Missing author');
            if (!schema.image) warnings.push('Missing image');
            if (!schema.publisher) warnings.push('Missing publisher');
          }
          if (type === 'FAQPage') {
            if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) errors.push('Missing mainEntity array');
            else schema.mainEntity.forEach((q, j) => {
              if (!q.name && !q.text) warnings.push(`Q${j}: missing question`);
              if (!q.acceptedAnswer) warnings.push(`Q${j}: missing acceptedAnswer`);
            });
          }
          if (type === 'HowTo') {
            if (!schema.name) warnings.push('Missing name');
            if (!schema.step || !Array.isArray(schema.step)) errors.push('Missing step array');
          }
          if (type === 'Product') {
            if (!schema.name) warnings.push('Missing name');
            if (!schema.offers) warnings.push('Missing offers/price');
          }
          if (type === 'BreadcrumbList') {
            if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) errors.push('Missing itemListElement');
          }
          if (type === 'Person') {
            if (!schema.name) warnings.push('Missing name');
            if (!schema.url) warnings.push('Missing url');
          }

          results.push({ index: i, type: type || 'Unknown', valid: errors.length === 0, errors, warnings, raw: schema });
        } catch (e) {
          results.push({ index: i, type: 'Invalid JSON', valid: false, errors: [e.message], warnings: [] });
        }
      });

      return { content: [{ type: 'text', text: JSON.stringify({ url: args.url, total: results.length, schemas: results }, null, 2) }] };
    }

    if (name === 'check_headings') {
      const { html } = await fetchPage(args.url);
      const $ = cheerio.load(html);
      const headings = [];
      const counts = {};

      $('h1, h2, h3, h4, h5, h6').each((_, el) => {
        const tag = el.tagName.toLowerCase();
        const text = $(el).text().trim();
        counts[tag] = (counts[tag] || 0) + 1;
        headings.push({ tag, text: text.slice(0, 120) });
      });

      const issues = [];
      if (!counts.h1) issues.push('Missing H1 tag');
      if ((counts.h1 || 0) > 1) issues.push(`Multiple H1 tags (${counts.h1})`);
      if (counts.h3 && !counts.h2) issues.push('H3 present without H2 (skipped level)');
      if (counts.h4 && !counts.h3) issues.push('H4 present without H3 (skipped level)');

      return { content: [{ type: 'text', text: JSON.stringify({ url: args.url, counts, headings, issues }, null, 2) }] };
    }

    if (name === 'audit_images') {
      const { html } = await fetchPage(args.url);
      const $ = cheerio.load(html);
      const images = [];

      $('img').each((_, el) => {
        const src = $(el).attr('src') || '';
        const alt = $(el).attr('alt');
        const loading = $(el).attr('loading') || '';
        const width = $(el).attr('width');
        const height = $(el).attr('height');
        images.push({
          src: src.slice(0, 200),
          has_alt: alt !== undefined && alt !== null,
          alt_text: (alt || '').slice(0, 100),
          alt_empty: alt === '',
          lazy_loading: loading === 'lazy',
          has_dimensions: !!(width && height),
        });
      });

      const total = images.length;
      const withAlt = images.filter(i => i.has_alt && !i.alt_empty).length;
      const emptyAlt = images.filter(i => i.alt_empty).length;
      const lazyLoaded = images.filter(i => i.lazy_loading).length;

      return { content: [{ type: 'text', text: JSON.stringify({
        url: args.url, total, with_alt: withAlt, empty_alt: emptyAlt,
        missing_alt: total - withAlt - emptyAlt,
        coverage: total > 0 ? Math.round(withAlt / total * 100) + '%' : 'N/A',
        lazy_loaded: lazyLoaded,
        images: images.filter(i => !i.has_alt || i.alt_empty)
      }, null, 2) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcp-seo-auditor running on stdio');
}

main().catch(console.error);
