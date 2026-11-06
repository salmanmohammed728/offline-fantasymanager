# AI Development Instructions

## Project Rules

You are helping develop the Offline Fantasy Manager.

Your responsibility is to improve the application without breaking existing functionality.

## Main Requirements

1. Maintain all existing working features.
2. Do not remove features without explicit approval.
3. Use HTML, CSS and vanilla JavaScript unless a change is approved.
4. Use IndexedDB for persistent local data.
5. Use Supabase for cloud persistence and synchronization.
6. Ensure offline functionality.
7. Keep the interface responsive on phones and computers.
8. Write clean, organized and reusable code.

## Development Workflow

Before making changes:

1. Read README.md.
2. Read INTERNAL_HANDOVER.md.
3. Inspect the existing project files.
4. Understand the current application structure.
5. Identify possible effects on existing features.

After making changes:

1. Test the modified functionality.
2. Check for JavaScript errors.
3. Verify data persistence.
4. Verify that existing features still work.
5. Update README.md when necessary.
6. Update INTERNAL_HANDOVER.md with completed work and remaining tasks.

## Data Protection

- Never overwrite existing user data without permission.
- Never expose private credentials.
- Never put Supabase service-role keys in frontend code.
- Use secure database access policies.
- Provide backup and restore functionality.

## Important Rule

Do not claim that a feature is complete unless it has been implemented and tested.
