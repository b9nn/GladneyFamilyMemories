Generate and apply an Alembic database migration.

Steps:
1. Review any recent changes to `backend/app/models.py` to understand what changed
2. Run: `cd backend && alembic revision --autogenerate -m "$ARGUMENTS"`
   - If no arguments provided, ask the user for a migration message describing the change
3. Show the generated migration file content for review
4. Ask the user to confirm before applying
5. If confirmed, run: `cd backend && alembic upgrade head`
6. Confirm the migration applied successfully

Rules:
- Never skip reviewing the generated migration file before applying
- If the migration contains `drop_table` or `drop_column`, warn the user explicitly
- Always run `alembic upgrade head` locally before committing migration files
- After applying, update `docs/changelog.md` under [Unreleased] if the schema change is significant
