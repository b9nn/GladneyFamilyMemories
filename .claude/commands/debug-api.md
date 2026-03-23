Debug an API issue between the frontend and backend.

Issue: $ARGUMENTS

Steps:
1. Check the browser console error (ask user to paste it if not provided)
2. Find the relevant FastAPI endpoint in `backend/app/main.py`
3. Check the Pydantic schemas for request/response type mismatches
4. Check the frontend API client call in `src/lib/api/` for incorrect parameters or URL
5. Check for CORS issues — is the request going to the right origin?
6. Check for auth issues — is the JWT token being sent? Is the route admin-only?
7. If a 500 error: read the FastAPI traceback and trace to the source
8. If a 422 Unprocessable Entity: the request body doesn't match the Pydantic schema — compare them

Common issues to check:
- Frontend sending camelCase, backend expecting snake_case (or vice versa)
- Missing `response_model` causing serialization errors
- R2 presigned URL expired (1 hour TTL)
- `source` column not set on file inserts
- Admin route called without `is_admin: true` in JWT
