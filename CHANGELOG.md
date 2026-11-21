# Changelog

## 0.2.0 — 2026-11-21

- Add a Memory conversation tab beside Chat/Trajectory: overview, all/current/global filters, search, expiry, source details, pagination, manual save, edit and confirmed delete.
- Register panel requests through DSH's authenticated owner-only Connection routes.
- Record optional write origin and project path; retain compatibility with existing version-1 records.
- Document GitHub repository installation as well as release tarballs; no build step is required.
- Explain cross-session scope and the two write triggers: panel saves and model tool calls.
- Add panel CRUD/revision regression tests and verify the real Web UI save/reload flow.

## 0.1.1 — 2026-11-21

- Support DSH 0.2.1-rc.2 alongside 0.2.2-rc.5 after service-level compatibility tests.
- Test real tool dispatch under both DSH tool execution APIs.
- Add reproducible compatibility runner and a Windows/Linux CI example (not yet enabled).
- Add public release URL installation, Chinese/English READMEs, self-test, troubleshooting and contribution guidance.
- Add repository, issue tracker and discovery metadata.

Memory format remains version 1; no data migration from 0.1.0 is needed.

## 0.1.0 — 2026-11-20

- Initial preview: local global/project memory, Chinese keyword retrieval, automatic recall, CRUD, expiry, deduplication and revision checks.
- DSH 0.2.2-rc.5 service tests and architecture analysis.
