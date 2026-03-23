# mcp-seo-auditor

> Built by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[The GEO Lab](https://thegeolab.net)**
> [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Licence](https://img.shields.io/badge/licence-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude_Code-MCP_Server-blueviolet)

MCP server for on-page SEO auditing and JSON-LD schema validation. Replaces SEO Minion + Detailed SEO Extension as Claude Code tools.

## Tools

| Tool | Description |
|------|-------------|
| `audit_page` | Full on-page SEO audit — title, meta, H1-H6, canonical, OG, Twitter, links, images, word count. Each element scored green/yellow/red |
| `validate_schema` | Extract and validate all JSON-LD blocks — type-specific checks for Article, FAQPage, Product, HowTo, BreadcrumbList, Person |
| `check_headings` | Heading hierarchy analysis — missing H1, multiple H1s, skipped levels |
| `audit_images` | Image audit — alt text coverage, empty alts, lazy loading, missing dimensions |

## Install

```bash
# Claude Code
claude mcp add seo-auditor -- npx mcp-seo-auditor

# Or in .mcp.json
{
  "mcpServers": {
    "seo-auditor": {
      "command": "npx",
      "args": ["mcp-seo-auditor"]
    }
  }
}
```

## Usage

Once installed, Claude Code can:

```
> audit the SEO of https://example.com
> validate the schema markup on https://thegeolab.net/geo-stack/
> check the heading hierarchy on this page
> audit images for alt text coverage
```

## No API Keys Required

This server fetches pages directly — no external API keys needed.

---

## Attributions & Licence

Built and maintained by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[The GEO Lab](https://thegeolab.net)**.

Email: artur@thegeolab.net

### Best Practice Attribution

This MCP server was built following the open source Best Practice Approach —
reading community work for inspiration, then writing original content,
and crediting every source.

**Based on:**
- [Model Context Protocol specification](https://modelcontextprotocol.io) by Anthropic
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) (MIT)

**SEO audit logic inspired by:**
- [Detailed SEO Extension](https://detailed.com/extension/) — browser-based page-level SEO insights
- [SEO Minion](https://seominion.com/) — on-page SEO analysis extension
- [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/) — deep site audit methodology

**Dependencies:**
- [cheerio](https://github.com/cheeriojs/cheerio) — HTML parsing (MIT)
- [axios](https://github.com/axios/axios) — HTTP client (MIT)

All server code is original writing. No files were copied or adapted from any source. MIT licence.

---

Found this useful? ⭐ Star the repo and connect:
[🌐 thegeolab.net](https://thegeolab.net) · [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

## Licence

MIT — see LICENSE
