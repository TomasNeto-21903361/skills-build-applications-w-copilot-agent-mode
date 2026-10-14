# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React UI thin and declarative by fetching through the shared client in `octofit-tracker/frontend/src/api/client.ts`, then rendering loading, empty, and error states from the API payloads without direct fetch calls in component logic.
- Logic tier decision: Build the Express layer around route handlers and service functions in `octofit-tracker/backend/src/services` so validation, idempotent inserts, and 4xx handling stay separated from the database and the HTTP transport.
- Data tier decision: Use Mongoose schemas with required field validation and relationship references, and keep the seed script idempotent so repeated runs preserve sentinel data while adding the expected demo fixtures.
- Activity tracking approach: Accept `userId` and `teamId`, validate they are valid IDs for existing records, reject malformed or missing references with a deliberate 4xx, and store the activity with computed `points` and `occurredAt` values derived from the submitted payload.
- Team management approach: Require `name` and `mascot`, keep `members` as an array of ObjectId references, and expose the linked user IDs in list responses without mutating existing records unexpectedly.
- Leaderboard approach: Aggregate team totals from activity points, sort descending by score, and assign sequential 1-based ranks to each team result while keeping the data contract stable for the frontend.
- Workout suggestions approach: Match a seeded user by email, inspect the user’s goal or recent activity patterns, recommend workouts whose `focus` aligns with that behavior, and return a descriptive `reason` while returning a 4xx for unknown emails.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Failure means the Mongoose schemas, model relations, or seed script do not satisfy the required data contract.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Failure means the Express route/service layer is not validating, storing, or responding to `/api/*` requests according to the contract.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Failure means the React presentation layer is not using the shared API client, not rendering expected data, or not handling loading/empty/error states correctly.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Failure means TypeScript validation or backend integration code is broken before the API contract can be trusted.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Failure means the Vite/React presentation code does not compile or the app cannot bundle the expected client behavior.
- Repository validation command: `node tests/exercise-validation.test.mjs`
  - Failure means the project is not satisfying the course’s end-to-end grading and protected contract checks.
