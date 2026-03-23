Review the current changes (git diff HEAD) for issues before committing.

Steps:
1. Run `git diff HEAD` to see all changed files
2. Read each changed file
3. Check for:
   - TypeScript `any` types (flag each one)
   - Missing `response_model` annotations on FastAPI endpoints
   - API calls made directly in components (should go through `src/lib/api/`)
   - Raw `useState + useEffect` for server data (should use TanStack Query)
   - Inline styles or raw CSS (should be Tailwind classes)
   - Hardcoded API URLs or secrets
   - `console.log` or `print()` debug statements left in
   - Missing error handling on mutations
   - Schema changes without a corresponding Alembic migration

Output a numbered list of issues with file:line references.
If no issues are found, say "Review passed — no issues found."
