---
name: GitHub sync access
description: How to sync project code when shell Git credentials are unavailable
---

When the shell rejects a GitHub push but the project's GitHub integration is connected, use its authenticated API proxy to make a non-forced commit against the current remote branch. Review the remote changes first, and avoid sending uploaded screenshots to the repository merely because they were committed locally.

**Why:** The shell credential helper was unavailable despite a working GitHub connection. The integration could update the repository without exposing credentials, while excluding unrelated attachments.

**How to apply:** Verify the remote ref and desired file list before writing. Use GitHub's tree, commit, and non-forced reference APIs; then verify the resulting branch and reconcile local history. When collecting paths through the code-execution shell callback, strip carriage returns before reading files.