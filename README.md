# mcp-seo-auditor

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

## By [The GEO Lab](https://thegeolab.net)

Built by Artur Ferreira. Part of the GEO Lab SEO intelligence toolkit.
