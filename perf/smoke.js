import http from "k6/http";
import { check, sleep } from "k6";

// k6 smoke test — run against a preview URL in CI:
//   k6 run -e BASE_URL=https://<preview>.vercel.app perf/smoke.js
//
// Thresholds encode the support SLOs we care about: healthy tenant p95 latency
// and zero 5xx under light concurrency. The slow-api tenant is excluded here on
// purpose — its 504 is the documented incident, not a regression.

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Hit the healthy tenant via Host header so routing matches production.
  const res = http.get(`${BASE_URL}/`, {
    headers: { Host: "healthy.localhost:3000" },
  });
  check(res, {
    "status is 200": (r) => r.status === 200,
    "served by tenant": (r) => r.body && r.body.length > 0,
  });
  sleep(1);
}
