# Execution Scripts

Deterministic Python scripts that handle the actual work.

## Principles
- **Deterministic** — Same input → same output, always
- **Well-commented** — Another developer (or agent) can understand the logic
- **Testable** — Include error handling and logging
- **Fast** — Optimize for speed; avoid unnecessary API calls

## Environment
- API keys and tokens are stored in `.env` (loaded via `python-dotenv`)
- Google OAuth credentials: `credentials.json` / `token.json`

## Naming Convention
```
execution/
├── scrape_single_site.py     # Verb + noun pattern
├── parse_preferences.py
├── generate_report.py
└── README.md                 # This file
```
