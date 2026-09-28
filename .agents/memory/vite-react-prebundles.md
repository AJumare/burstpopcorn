---
name: Vite React prebundles
description: Diagnosing a React/react-dom mismatch that persists after both installed packages match.
---

When a development preview reports mismatched React and React DOM versions after a pnpm upgrade, check the versions in Vite's optimized dependencies before changing package versions again.

**Why:** Vite can keep serving prebundled copies of the older package versions even when pnpm has correctly installed matching versions. Typechecking and production builds can pass while the browser still fails.

**How to apply:** Compare the versions the browser reports with both the installed package versions and Vite's generated prebundle. If only the prebundle is stale, clear that generated cache and restart the managed web workflow.