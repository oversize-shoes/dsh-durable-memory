# Contributing

English and Chinese bug reports and focused pull requests are welcome.

Use Node.js 24.9.0+:

```sh
git clone https://github.com/oversize-shoes/dsh-durable-memory.git
cd dsh-durable-memory
npm ci --ignore-scripts
npm test
npm run check
node scripts/test-compat.mjs 0.2.1-rc.2
node scripts/test-compat.mjs 0.2.2-rc.5
npm pack
```

The compatibility runner installs exact service dependencies into a temporary directory, runs the same tests and removes that directory. It does not modify DSH profiles. A Windows/Linux matrix is provided in docs/ci-example.yml; it is not enabled until a maintainer with workflow authorization adds it to .github/workflows/. Service tests do not claim full real-model/Desktop validation.

Keep changes on DSH public extension points. Preserve scope isolation, persisted data versioning, error visibility and lifecycle cleanup. Add regression tests for behavior changes. Test additional host versions before expanding compatibility ranges.

Reports should include DSH/Node/OS versions, profile name, installation method, reproduction steps, expected/actual results and redacted errors. State whether the backend was restarted. Do not upload memory databases, credentials or unreviewed session logs.

For security issues, use private vulnerability reporting if available. Otherwise open a minimal issue requesting a private channel without disclosing sensitive details.

PRs should explain the user-visible change and commands actually run. Update both READMEs and CHANGELOG.md when behavior or installation changes. Contributions use this repository's MIT license.
