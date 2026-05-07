# Security Self-Check

Generated: 2026-05-07T20:41:49.379Z

| Check | Status | Notes |
| --- | --- | --- |
| request body max size | PASS | readJsonBody rejects bodies over 64 KB |
| message max length | PASS | chat-server rejects messages over 2,000 characters |
| siteId must exist | PASS | geotherm site exists in sites table |
| allowed origin | PASS | http://127.0.0.1:4321 |
| anonymousId fallback | PASS | server generates anonymousId when missing |
| no frontend secrets | PASS | widget config contains apiBase/siteId only |
| structured errors | PASS | errors use { error: { code, message } } |
| production auth | FAIL | no signed site key yet |
| rate limiting | FAIL | not implemented in this local MVP |

## Verdict

Local MVP security is acceptable for development only. It is not production-safe until signed site keys, real tenant isolation, rate limiting, and audit-grade auth are implemented.
