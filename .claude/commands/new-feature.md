Build a full-stack feature end-to-end.

Feature to build: $ARGUMENTS

Steps (in order):
1. **Plan**: Identify which files to create/modify. Read existing similar features for patterns.
2. **Backend schemas**: Add Pydantic request/response schemas to `backend/app/schemas.py`
3. **Backend model** (if needed): Add/update SQLAlchemy model in `backend/app/models.py`
4. **Migration** (if model changed): Run `alembic revision --autogenerate -m "Add ..."`, review the file, apply with `alembic upgrade head`
5. **Backend endpoint**: Add route(s) to `backend/app/main.py` following existing patterns
6. **Frontend types**: Add/update TypeScript interfaces in `src/types/api.ts`
7. **Frontend API client**: Add typed API function(s) to the appropriate `src/lib/api/*.ts` file
8. **Frontend hook**: Create or update a TanStack Query hook in `src/features/<name>/hooks/`
9. **Frontend component**: Build the UI component(s) in `src/features/<name>/components/`
10. **Typecheck**: Run `npm run typecheck` — fix all errors before finishing

Rules:
- Read 2–3 existing similar features before writing anything
- Follow the exact patterns you find — don't introduce new patterns
- Never skip the typecheck step
