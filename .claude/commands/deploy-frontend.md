Build and deploy the frontend to GitHub Pages (mrtag.com).

Pre-flight checks:
1. Run `cd frontend && npm run typecheck` — must pass with 0 errors
2. Run `cd frontend && npm run lint` — must pass with 0 errors
3. Confirm current branch is `main` (or ask user to confirm deploy from non-main)

Build:
4. Run `cd frontend && npm run build`
5. Confirm build succeeded and check bundle size (`dist/assets/*.js`)
6. Warn if main bundle exceeds 500KB gzipped

Deploy:
7. The GitHub Actions workflow `deploy-frontend.yml` handles the actual deploy on push to main
8. If triggering manually: push current branch to main, then monitor the Actions run
9. After deploy, verify at https://mrtag.com that the new version loaded

Post-deploy:
10. Update `docs/changelog.md` with what was deployed
