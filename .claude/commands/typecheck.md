Run TypeScript typecheck on the frontend and fix all errors.

Steps:
1. Run: `cd frontend && npm run typecheck 2>&1`
2. If there are errors, read the relevant files and fix each error
3. Re-run typecheck after fixes to confirm zero errors
4. Report: "TypeScript: 0 errors" when clean

Rules:
- Never use `any` as a fix — use proper types or `unknown` with a comment
- If an error is in `src/components/ui/` (shadcn auto-generated), do not edit that file — instead fix the caller
- Fix all errors before marking done — partial fixes are not acceptable
