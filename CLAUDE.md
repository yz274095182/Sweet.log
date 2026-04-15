# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `pnpm dev:mp-weixin`   | Dev build for WeChat Mini Program        |
| `pnpm build:mp-weixin` | Production build for WeChat Mini Program |
| `pnpm dev:app`         | Dev build for uni-app (H5/App)           |
| `pnpm build:app`       | Production build for uni-app             |
| `pnpm test`            | Run vitest tests                         |
| `pnpm test:watch`      | Run tests in watch mode                  |

## Code Style

- TypeScript with `.uts` and `.uvue` uni-app dialect (not standard TS/Vue)
- 2-space indentation
- Use `pnpm` as package manager
- Format on save with Prettier (auto-runs via hook on Edit/Write)

## File Types

| Extension | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| `.uvue`   | uni-app Vue single-file component (different syntax from `.vue`) |
| `.uts`    | uni-app TypeScript dialect                                       |

## Project Structure

```
src/                    # uni-app source
  pages/               # page components
  store/               # Pinia stores
  utils/               # utilities
  static/              # assets
cloudfunctions/         # WeChat cloud functions (Node.js, separate)
dist/                   # build output (gitignored)
```

## Branch Convention

- `main` — production branch
- `feature/xxx` — feature branches
