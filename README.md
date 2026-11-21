# DSH Durable Memory

[简体中文](README.zh-CN.md) · [Releases](https://github.com/oversize-shoes/dsh-durable-memory/releases) · [Issues](https://github.com/oversize-shoes/dsh-durable-memory/issues)

Local, cross-session memory for DeepSeek Harness. Remember project conventions, stable preferences and lessons, and recall them in new conversations. Independent community plugin, MIT licensed. **0.2.0 is a preview release.**

## Features

- Persistent memory through DSH's native storage domain.
- Separate working-directory and global scopes.
- Automatic retrieval within a character budget.
- Chinese bigram and English keyword search; no embedding service or extra API key.
- Save, search, list, update and delete; expiry, pinning, deduplication and revision checks.

Saving is model-driven through the `durable_memory` tool. There is no background LLM extraction. Recalled content is sent to your configured model provider and uses context tokens.

## Requirements

| Component | Requirement |
|---|---|
| DSH | **0.2.1-rc.2 or 0.2.2-rc.5**; only these releases are declared compatible |
| Node.js | **24.9.0+** |
| Package manager | pnpm available to the DSH installer |
| Profile | Web or a custom profile providing agents, tools, systemPrompt and storageDomain |

Check `node --version`, `dsh --version`, and `pnpm --version`. Full Desktop validation remains pending. Do not bypass compatibility checks for other releases.

## Install from GitHub (no tarball required)

```sh
dsh plugin --profile web add "github:oversize-shoes/dsh-durable-memory#v0.2.0"
```

In the DSH Add plugin dialog, use the same `github:oversize-shoes/dsh-durable-memory#v0.2.0` source. Replace `web` with your actual profile. All runnable JS, including the browser panel, is committed; no build/install scripts are required. Pin a release tag for reproducibility.

## Alternative: release tarball

Download **dsh-durable-memory-0.2.0.tgz** from the [release page](https://github.com/oversize-shoes/dsh-durable-memory/releases/tag/v0.2.0). Use **Plugins → Add plugin** in DSH to select the file or enter its full local path. Do not select GitHub's automatically generated Source code archives.

For the Web profile, install directly:

```sh
dsh plugin --profile web add "https://github.com/oversize-shoes/dsh-durable-memory/releases/download/v0.2.0/dsh-durable-memory-0.2.0.tgz"
```

If download fails, download manually and install the local file:

```powershell
dsh plugin --profile web add "C:/Downloads/dsh-durable-memory-0.2.0.tgz"
```

Replace `web` with the profile you actually run. Desktop wrappers may use a different name. Follow the host's enable/restart instructions. Restart the DSH backend if necessary; refreshing the browser alone may not load plugins. Open a new conversation and confirm the **durable_memory** tool is available.

The tarball contains runnable JS and has no install scripts or build step. **The package has not been published to npm by name.** Use the GitHub repository, release URL or tarball.

## Memory panel and write triggers

Open an existing conversation and select **Memory** beside **Chat / Trajectory**. The panel lists all stored entries, with current-project/global filters, keyword search, active/expired status, timestamps and source details. You can add, edit and delete entries directly. An empty new-conversation home screen may not show conversation tabs yet.

Memory persists across conversations and DSH restarts. Project entries apply to the same canonical working directory; global entries apply across directories in the same storage.

Writes occur only when you click Save in the panel, or the model calls a mutation tool. The model is prompted to save stable facts and may choose to call the tool even without an explicit "remember" request. There is no deterministic end-of-turn extraction. Opening a conversation and automatic recall do not create memories. Confirm actual saves in the panel rather than relying on conversational assurances.

## Three-minute verification

In conversation A with a working directory:

> Call durable_memory and save a project memory: this project's test phrase is "blue-whale-731". Report the saved ID.

Create conversation B with the **same working directory**:

> Search durable_memory for this project's test phrase.

Expected: `blue-whale-731`. Then ask to update it to `blue-whale-732`, list memories and delete the test entry. Updates and deletes require the ID and current revision. To verify isolation, use a different actual working directory; changing the conversation title is not sufficient.

For shared preferences, explicitly request **global** scope. Project searches include global entries, but changing a global entry requires `scope=global`.

## Storage and privacy

Default: `$DSH_HOME/storages/durable_memory.json`, normally `%USERPROFILE%/.dsh/storages/durable_memory.json` on Windows. Custom backend routing may change the location. Uninstalling preserves data.

Project scope is the exact canonical session working directory. Git subdirectories and worktrees have different scopes; moving a folder changes its scope. Global scope is shared within this DSH storage, not cloud-synced. Conversations without a working directory automatically recall global entries only.

The plugin adds no telemetry, cloud sync or independent model calls, but recalled data reaches your model provider. Common credential detection is incomplete: do not save secrets. Deletion and expiry prevent future recall but cannot erase copies already in conversation logs or backups. Source fields locate the save operation, not independently verified evidence. Memory is historical reference and may be outdated.

## Configuration

Set these fields on the plugin's loader row, then reload/restart as instructed by DSH:

| Field | Default | Purpose |
|---|---:|---|
| enabled | true | Enable plugin |
| maxEntries | 2000 | Total capacity, including expired entries |
| maxContentChars | 2000 | Maximum JS characters per entry |
| recallChars | 6000 | Automatic context budget, including heading |
| recallLimit | 8 | Maximum search/recall results |

Save accepts `tags`, `pinned` and `ttlDays` (0 means no expiry). Full capacity rejects new saves. `list` includes expired entries for cleanup. Before receiving a query, recall offers recent/pinned memories; subsequent messages drive keyword retrieval. Pinning remains subject to the budget. Keyword search may miss synonyms.

## Update and uninstall

Install the new release URL in the same profile, then restart as instructed. Back up the memory file with DSH stopped before upgrades.

```sh
dsh plugin --profile web remove dsh-durable-memory
```

Disabling/uninstalling removes future context injection and tool registration, retaining data.

## Troubleshooting

- **No tool:** verify installation and runtime profiles match, restart the backend and check plugin loading status.
- **No recall:** verify the save tool ran, use the same working directory and explicitly request a search.
- **Version rejected:** report your exact DSH version; do not force installation.
- **dsh missing from PATH:** use your existing launcher or Node CLI path.

## Validation and contribution

Tests use real DSH Cordis, storage, prompt and tool services with minimal agent doubles. They cover persistence, isolation, expiry, deduplication, revision conflicts, corrupt storage, dispatch, unload and reload. A clean DSH 0.2.1-rc.2 Web profile also booted on Windows with the tarball installed; a probe confirmed the tool and storage domain were ready. Full real-model/Desktop end-to-end validation remains pending. A [Windows/Linux CI example](docs/ci-example.yml) is provided but is not enabled: publishing Actions workflows requires additional GitHub authorization. Local results do not imply Linux CI passed.

No background extraction, semantic embeddings, revision history, cloud sync or concurrent multi-process writers are provided yet.

See [contribution guidance](CONTRIBUTING.md), [changelog](CHANGELOG.md), [architecture analysis](docs/architecture-analysis.txt) and [MIT license](LICENSE). Remove secrets/private paths before sharing logs.
