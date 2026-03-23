Run a production smoke test against mrtag.com to verify the deployment is healthy.

Work through this checklist and report pass/fail for each item:

**Auth**
- [ ] https://mrtag.com loads without errors
- [ ] Login page renders
- [ ] Login with valid credentials succeeds → redirected to dashboard
- [ ] Login with invalid credentials shows error (does not crash)

**Dashboard**
- [ ] Dashboard page loads with stats
- [ ] Background image displays (if set)

**Content**
- [ ] Vignettes page loads and shows existing vignettes
- [ ] Photos page loads
- [ ] Audio page loads
- [ ] Files page loads

**API**
- [ ] `GET https://mrtag.com/api/auth/health` returns 200
- [ ] `GET https://mrtag.com/api/auth/me` with valid token returns user data

**Upload (if safe to test)**
- [ ] Upload a small test photo → appears in gallery
- [ ] Confirm photo URL is an R2 presigned URL (not a localhost URL)

**Admin (admin account required)**
- [ ] Admin panel loads
- [ ] User list shows family members

Report results and flag any failures with details.
