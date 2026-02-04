# Analytics API (for front-end / Vite)

Base path used below: `api/v1/analytics` (append each route shown).

Note: All endpoints are protected by `x-api-key` and JWT. Include headers:
- `x-api-key: <your-api-key>`
- `Authorization: Bearer <jwt>`

Examples use placeholders `{{today}}` and `{{until}}` (ISO or JS-parsable datetime). Limit defaults are documented per-endpoint.

---

**GET /endpoint-stats**
- Path: `api/v1/analytics/endpoint-stats?startDate={{today}}&endDate={{until}}&endpoint=/api/users&limit=50`
- Query params: `startDate` (required), `endDate` (required), `endpoint` (optional), `limit` (optional)
- Returns: array of objects:

```
[
  {
    "path": "/api/users",
    "method": "GET",
    "request_count": 12345,
    "avg_response_time": 210.4,
    "p50_response_time": 180,
    "p95_response_time": 450,
    "p99_response_time": 900,
    "min_response_time": 50,
    "max_response_time": 1200,
    "error_5xx_count": 12,
    "error_4xx_count": 34,
    "success_2xx_count": 12299,
    "cache_hit_count": 1024,
    "total_request_size": 12345678,
    "total_response_size": 98765432
  },
  ...
]
```

**GET /hourly-traffic**
- Path: `api/v1/analytics/hourly-traffic?startDate={{today}}&endDate={{until}}`
- Query params: `startDate`, `endDate` (both required)
- Returns: array (hourly buckets, newest first):

```
[
  {
    "hour": "2026-02-03 14:00:00",
    "request_count": 345,
    "avg_response_time": 200.1,
    "error_5xx_count": 2,
    "error_4xx_count": 5,
    "success_2xx_count": 338
  },
  ...
]
```

**GET /summary**
- Path: `api/v1/analytics/summary?startDate={{today}}&endDate={{until}}&endpoint=/api/users`
- Query params: `startDate` (required), `endDate` (required), `endpoint` (optional - filters to a single path)
- Returns: single `AnalyticsSummaryDto` object with consolidated dashboard metrics, including:
  - `dailySummary`: { total_requests, unique_users, days, avg_response_time, p95_response_time, error_5xx_count, error_4xx_count, success_2xx_count }
  - `traffic`: { peak_hour: { hour, request_count } | null, avg_requests_per_hour }
  - `endpoints`: { unique_endpoints, top_by_traffic: [{ path, request_count }], slowest_by_p95: [{ path, p95, request_count }] }
  - `cache`: { overall_cache_hit_rate_percent, top_by_cache_hit: [{ path, total_requests, cache_hits, cache_hit_rate_percent }] }
  - `errors`: { summary: { total_errors, affected_users }, by_severity: [{ severity, count }] }
  - `userActivities`: { summary: { total_activities, unique_users, unique_activity_types }, top_users: [{ user_id, activity_count }] }
  - `geo`: { top_countries: [{ country_code, request_count }] }

Example response:

```
{
  "dailySummary": { "total_requests": 120000, "unique_users": 15000, "days": 7, "avg_response_time": 210.2, "p95_response_time": 420 },
  "traffic": { "peak_hour": { "hour": "2026-02-03 14:00:00", "request_count": 345 }, "avg_requests_per_hour": 714.29 },
  "endpoints": { "unique_endpoints": 120, "top_by_traffic": [{ "path": "/api/users", "request_count": 20000 }], "slowest_by_p95": [{ "path": "/api/reports", "p95": 1200, "request_count": 500 }] },
  "cache": { "overall_cache_hit_rate_percent": 72.5, "top_by_cache_hit": [{ "path": "/api/products", "total_requests": 10000, "cache_hits": 9000, "cache_hit_rate_percent": 90 }] },
  "errors": { "summary": { "total_errors": 120, "affected_users": 80 }, "by_severity": [{ "severity": "high", "count": 50 }, { "severity": "medium", "count": 40 }] },
  "userActivities": { "summary": { "total_activities": 50000, "unique_users": 14000, "unique_activity_types": 25 }, "top_users": [{ "user_id": "123", "activity_count": 1024 }] },
  "geo": { "top_countries": [{ "country_code": "US", "request_count": 80000 }, { "country_code": "IN", "request_count": 20000 }] }
}
```

**GET /user-activities**
- Path: `api/v1/analytics/user-activities?startDate={{today}}&endDate={{until}}&limit=100&includeMetadata=true`
- Query params: `startDate` (required), `endDate` (optional), `limit` (optional), `includeMetadata` (optional, set `true` to include `metadata_list`)
- Returns: aggregated activity rows; if `includeMetadata=true` each row includes `metadata_list` array:

```
[
  {
    "activity_type": "update",
    "resource_type": "profile",
    "activity_count": 120,
    "unique_users": 90,
    "last_event_time": "2026-02-03 13:59:10",
    "metadata_list": [
      '{"event_time":"2026-02-03 12:00:00","metadata":{"field":"email","old":"a","new":"b"}}',
      ...
    ] // present only when includeMetadata=true
  },
  ...
]
```

**GET /single-user-activities**
- Path: `api/v1/analytics/single-user-activities?userId=123&startDate={{today}}&endDate={{until}}&limit=50&includeMetadata=true`
- Query params: `userId` (required), `startDate` (required), `endDate` (optional), `limit` (optional), `includeMetadata` (optional)
- Returns: array of activity aggregates for that user, optionally with `metadata_list`:

```
[
  {
    "activity_type": "login",
    "resource_type": "session",
    "activity_count": 10,
    "first_event": "2026-01-15 09:00:00",
    "last_event": "2026-02-03 13:00:00",
    "metadata_list": [ ... ] // optional
  },
  ...
]
```

**GET /single-user-activities-with-metadata**
- Path: `api/v1/analytics/single-user-activities-with-metadata?userId=123&startDate={{today}}&endDate={{until}}&limit=100`
- Query params: same as single-user-activities (but returns raw metadata rows)
- Returns: rows with `activity_type`, `resource_type`, `activity_count`, `date`, `metadata`:

```
[
  {
    "activity_type": "update",
    "resource_type": "profile",
    "activity_count": 1,
    "date": "2026-02-03 12:00:00",
    "metadata": "{...}" // metadata as stored (string/JSON)
  },
  ...
]
```

**GET /top-users**
- Path: `api/v1/analytics/top-users?startDate={{today}}&endDate={{until}}&limit=50`
- Query params: `startDate`, `endDate`, `limit` (optional)
- Returns: array of top users:

```
[
  {
    "user_id": "123",
    "activity_count": 1024,
    "unique_activity_types": 12,
    "first_activity": "2025-12-01 08:00:00",
    "last_activity": "2026-02-03 13:00:00"
  },
  ...
]
```

**GET /errors**
- Path: `api/v1/analytics/errors?startDate={{today}}&endDate={{until}}&limit=100`
- Returns: recent error log rows:

```
[
  {
    "event_time": "2026-02-03 12:34:56",
    "error_type": "TypeError",
    "error_message": "Cannot read property 'x' of undefined",
    "endpoint": "/api/users",
    "severity": "high",
    "user_id": "123",
    "request_id": "req_abc123"
  },
  ...
]
```

**GET /error-stats**
- Path: `api/v1/analytics/error-stats?startDate={{today}}&endDate={{until}}`
- Returns: grouped error counts:

```
[
  {
    "error_type": "TypeError",
    "severity": "high",
    "error_count": 150,
    "affected_users": 80,
    "affected_endpoints": ["/api/users","/api/orders"]
  },
  ...
]
```

**GET /performance**
- Path: `api/v1/analytics/performance?startDate={{today}}&endDate={{until}}&limit=50`
- Returns: per-path latency percentiles:

```
[
  {
    "path": "/api/users",
    "request_count": 5000,
    "p50": 180,
    "p75": 220,
    "p90": 350,
    "p95": 420,
    "p99": 900,
    "avg_response_time": 210.3
  },
  ...
]
```

**GET /cache-stats**
- Path: `api/v1/analytics/cache-stats?startDate={{today}}&endDate={{until}}`
- Returns: cache hit rates per path:

```
[
  {
    "path": "/api/users",
    "total_requests": 10000,
    "cache_hits": 8000,
    "cache_hit_rate_percent": 80.0,
    "avg_response_time": 150.2
  },
  ...
]
```

**GET /geo-stats**
- Path: `api/v1/analytics/geo-stats?startDate={{today}}&endDate={{until}}&limit=50`
- Returns: request counts by `country_code`:

```
[
  {
    "country_code": "US",
    "request_count": 123456,
    "unique_users": 54321,
    "avg_response_time": 210.1
  },
  ...
]
```

**GET /daily-summary**
- Path: `api/v1/analytics/daily-summary?startDate={{today}}&endDate={{until}}`
- Returns: daily aggregated metrics (newest first):

```
[
  {
    "date": "2026-02-03",
    "total_requests": 50000,
    "unique_users": 15000,
    "avg_response_time": 220.5,
    "p95_response_time": 420,
    "error_5xx_count": 30,
    "error_4xx_count": 120,
    "success_2xx_count": 49850,
    "success_rate_percent": 99.7,
    "total_request_size": 123456789,
    "total_response_size": 987654321
  },
  ...
]
```

**DELETE /drop-analytics** (dangerous)
- Path: `api/v1/analytics/drop-analytics` (HTTP DELETE)
- Body JSON (example):

```
{
  "startDate": "2026-01-01 00:00:00",
  "endDate": "2026-01-31 23:59:59",
  "table": "http_requests", // allowed: http_requests, user_activities, error_logs, all
  "confirm": true
}
```
- Notes: `confirm` must be `true`. Operation submits async ClickHouse ALTER TABLE DELETE mutations. Response shape:

```
{
  "ok": true,
  "message": "Delete mutations submitted (async operation)",
  "details": [ { "table": "analytics.http_requests", "sql": "ALTER TABLE analytics.http_requests DELETE WHERE ..." } ],
  "note": "Check system.mutations table for progress"
}
```

---

Quick tips for front-end developers:
- Use `startDate` and `endDate` as ISO strings or any JS-parsable datetime. Server normalizes them to `YYYY-MM-DD HH:mm:ss`.
- When requesting metadata use `includeMetadata=true`. Metadata fields may be JSON-strings; parse carefully.
- Keep `limit` within reasonable bounds to avoid large payloads (server caps to 1000 where applicable).

If you want, I can also add example fetch snippets (Fetch API / Axios) for each endpoint.
