# CLAUDE.md — ESM

Guidance for AI coding agents working in `ESM`.

## Project & Stack

- **Name**: `ESM`
- **Stack**: Python, Web/Node
- **Role**: Part of NODAYSIDLE workspace. Self-contained module.

## Build & Test Commands

```bash
# Frontend / Dev
npm install
npm run dev
npm test

# Python Environment
python -m venv .venv
source .venv/bin/activate.fish
pytest
```

## Workflow & Constraints

1. Keep edits focused and atomic.
2. Read `AGENTS.md` before architectural refactors.
3. Keep code local-first, minimal dependencies, and well-typed.
