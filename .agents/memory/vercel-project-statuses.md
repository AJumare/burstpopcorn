---
name: Vercel project statuses
description: How to interpret Vercel deployments for this repository
---

Several Vercel projects watch the same Burst Popcorn repository. Treat their deployment statuses separately and identify the actual customer-facing storefront before concluding whether the shop rollout succeeded. A generated deployment-preview URL may redirect to Vercel login even when a production alias is publicly available.

**Why:** The same source update produced both successful and failed project statuses, and the successful preview URL was access-protected. Aggregate GitHub status alone could misstate whether customers can use checkout.

**How to apply:** Ask for or verify the storefront's real public URL, then check its served page and API rewrite. Investigate a failed project through its own Vercel logs only if it is relevant to the storefront.