// SummingMergeTree in "analytics.daily_endpoint_stats" for daily aggregated stats will get more size but better performance for reads
export function CLICKHOUSE_INIT_SQL(): string {
  return `
CREATE DATABASE IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.http_requests (
    event_time DateTime64(3) DEFAULT now64(3),
    request_id String,
    method String,
    path String,
    status_code UInt16,
    response_time_ms UInt32,
    user_id String DEFAULT '',
    user_agent String DEFAULT '',
    ip_address String DEFAULT '',
    country_code String DEFAULT '',
    request_size UInt32 DEFAULT 0,
    response_size UInt32 DEFAULT 0,
    error_message String DEFAULT '',
    endpoint_version String DEFAULT '',
    cache_hit UInt8 DEFAULT 0,
    date Date DEFAULT toDate(event_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_time, path)
TTL date + INTERVAL 90 DAY
SETTINGS index_granularity = 8192;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.daily_endpoint_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, path, method)
TTL date + INTERVAL 365 DAY
SETTINGS index_granularity = 8192
AS SELECT
    toDate(event_time) AS date,
    path,
    method,
    count() AS request_count,
    avg(response_time_ms) AS avg_response_time,
    quantile(0.95)(response_time_ms) AS p95_response_time,
    quantile(0.99)(response_time_ms) AS p99_response_time,
    sum(request_size) AS total_request_size,
    sum(response_size) AS total_response_size,
    countIf(status_code >= 500) AS error_5xx_count,
    countIf(status_code >= 400 AND status_code < 500) AS error_4xx_count,
    countIf(cache_hit = 1) AS cache_hit_count
FROM analytics.http_requests
GROUP BY date, path, method;

CREATE TABLE IF NOT EXISTS analytics.user_activities (
    event_time DateTime64(3) DEFAULT now64(3),
    user_id String,
    activity_type String,
    resource_type String DEFAULT '',
    resource_id String DEFAULT '',
    metadata String DEFAULT '',
    date Date DEFAULT toDate(event_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (user_id, date, event_time)
TTL date + INTERVAL 180 DAY
SETTINGS index_granularity = 8192;

CREATE TABLE IF NOT EXISTS analytics.error_logs (
    event_time DateTime64(3) DEFAULT now64(3),
    error_type String,
    error_message String,
    stack_trace String DEFAULT '',
    request_id String DEFAULT '',
    user_id String DEFAULT '',
    endpoint String DEFAULT '',
    severity Enum8('low' = 1, 'medium' = 2, 'high' = 3, 'critical' = 4),
    date Date DEFAULT toDate(event_time)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_time, severity)
TTL date + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;
`;
  //ALTER TABLE analytics.user_activities
  //MODIFY TTL date + INTERVAL 90 DAY;
}
