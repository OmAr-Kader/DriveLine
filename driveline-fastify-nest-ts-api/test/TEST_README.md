# K6 smoke test (Quick Guide) ✅

Prereqs:
- Install k6: `brew install k6`

Run:
- Use the default base URL (set by `test/secureConst.js`) or override:
  - Example (local): `API_BASE_URL=http://localhost:3000/api/v1 k6 run test/main.js`
  - Example with VUs/DURATION env overrides: `K6_VUS=1 K6_DURATION=1m API_BASE_URL=http://localhost:3000/api/v1 k6 run test/main.js`

What it does (single iteration):
1. Register a randomized user
2. Login (requires `sign-key` header)
3. Patch/update user
4. Create a short video
5. Create a fix service
6. Create a course
7. Fetch latest shorts
8. Get user profile

Troubleshooting:
- If you get 401 unauthorized on endpoints, ensure `API_BASE_URL` is correct and the sign-key is present (`SIGN_KEY` env var).
- Check server logs for flow errors (most endpoints use `user-id` header for current user).