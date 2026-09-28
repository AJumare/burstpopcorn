---
name: Checkout publish order
description: Release ordering for the storefront and its separate payment API
---

When checkout routes change, publish the Replit API before updating the static Vercel storefront. Confirm that the published callback address serves the order page and that the published API serves the new routes before accepting payments.

**Why:** The Vercel build serves only static frontend files and forwards payment API requests to the separately published Replit app. A storefront rollout ahead of the API can offer checkout links whose verification route is still missing.

**How to apply:** Check the current hosting configuration first. If the frontend and API are still separately published, validate the API and return page in production before rolling out the frontend.