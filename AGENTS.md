# AGENTS.md — ESM

Operating rules and technical architecture boundaries for `ESM`.

## Scope & Responsibility

`ESM` is an independent project inside the NODAYSIDLE workspace.
- Stack: Python, Web/Node
- Run tests and builds from within this repository directory.
- Preserve existing comments and docstrings unless explicitly refactoring.

## Architecture Guidelines

- Default to simple, direct implementations. Avoid speculative abstractions.
- All errors must be handled gracefully without silently dropping failures.
- If this project interacts with other services, verify boundaries before changes.
