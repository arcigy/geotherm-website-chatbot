# Security Self-Check

Generated: 2026-06-02T04:39:13.379Z

| Check | Status | Notes |
| --- | --- | --- |
| request body max size | PASS | readJsonBody rejects bodies over 64 KB |
| message max length | PASS | chat-server rejects messages over 2,000 characters |
| siteId must exist | PASS | geotherm site exists in sites table |
| allowed origin | PASS | http://127.0.0.1:4321 |
| anonymousId fallback | PASS | server generates anonymousId when missing |
| no frontend secrets | PASS | widget config contains apiBase/siteId only |
| structured errors | PASS | errors use { error: { code, message } } |
| production auth | PASS | signed /chat request is accepted and unsigned request is rejected |
| rate limiting | PASS | real /chat request returns 429 rate_limited with Retry-After after configured limit |

## Verdict

Security is stronger with signed site requests and enforced chat rate limiting. For full production, keep the signature secret in server/runtime configuration and use real tenant isolation plus audit-grade auth for operators.
