---
title: "Duende CLI Reference"
description: "Install the Duende CLI and use its storage plugin to migrate Duende Storage schemas"
date: 2026-10-12
sidebar:
  label: "Duende CLI"
  order: 45
---

:::caution[Preview documentation]
This page describes preview packages and APIs that are subject to change. Start with the
[Duende Storage overview](/identityserver/data/providers/duende-storage/index.mdx) for the preview scope.
:::

The Duende CLI (`duende`) is a .NET global tool. Its `storage` command loads the Duende Storage CLI plugin, which
migrates the Duende Storage schema for SQL Server, PostgreSQL, and SQLite. Run it as a separate deployment step,
before your application instances start, instead of migrating from application code.

## Install the Duende CLI

Install the tool as a global tool:

```bash
# Terminal
dotnet tool install --global Duende.Cli --prerelease
```

`--prerelease` installs the current preview build. Omitting `--prerelease` also installs a working release of the
tool, just an older one, so use `--prerelease` to get the latest commands and fixes.

To pin the tool to a repository instead of installing it globally, use a local tool manifest:

```bash
# Terminal
dotnet new tool-manifest
dotnet tool install Duende.Cli --prerelease
```

With a local tool manifest, run the tool with `dotnet tool run duende` or `dotnet duende`.

## How the CLI Loads the Storage Plugin

The `storage` command isn't built into the `duende` tool itself. It ships in a separate package,
`Duende.Storage.CliPlugin`, that the CLI downloads from nuget.org the first time you run a `storage` command, then
caches locally and reuses.

The CLI resolves which plugin version to download in this order:

* `--plugin-path`, if you pass it.
* `--plugin-version`, if you pass it.
* Project context: if the current directory contains a restored project or solution that references `Duende.Storage`
  (directly, or transitively through any `Duende.Storage.*` provider package), the CLI reads the resolved package
  version from `dotnet list package --include-transitive`. This needs the project to have been restored, so run
  `dotnet restore` first if you haven't.

Once it has a version, the CLI downloads the matching `Duende.Storage.CliPlugin` package from nuget.org and extracts
it into the NuGet global packages folder, under `duende.storage.cliplugin/<version>/`. Later runs with the same
version load the cached copy instead of downloading again. Because the plugin comes from nuget.org, the machine
running the CLI needs network access to nuget.org the first time it uses a given plugin version.

If the CLI can't determine a version from `--plugin-version` or project context, it reports an error and suggests
passing `--plugin-version` or `--plugin-path` explicitly.

## Commands

### storage migrate

Creates or upgrades the Duende Storage schema for one database.

Options:

| Option | Description |
| --- | --- |
| `--provider <provider>` (required) | Database provider to migrate: `postgresql`, `mssql`, or `sqlite`. |
| `--connection-string <connection-string>` | Database connection string. Falls back to `DUENDE_STORAGE_CONNECTION_STRING`. |
| `--schema <schema>` | Database schema name. Defaults to `public` for `postgresql` and `dbo` for `mssql`. SQLite doesn't support schemas. |
| `--dry-run` | Show migration SQL without executing it. |

Behavior:

* It reports the current schema version and the required version.
* If the database is already at the required version, it reports that and makes no changes.
* If the database's schema version is newer than the version this CLI build knows about, it reports an error instead
  of migrating.
* `--dry-run` still connects to the database to read its current version, then prints the migration SQL for that
  version without running it. It makes no changes either way.
* Without `--dry-run`, it runs the migration and reports the new version.

Oracle isn't supported by `storage migrate` yet. Support is coming; until then, use the
[Oracle page's code-based migration](/identityserver/data/providers/duende-storage/databases/oracle.md#create-and-upgrade-the-schema-without-the-cli).

#### Examples

SQL Server:

```powershell
# Terminal
$env:DUENDE_STORAGE_CONNECTION_STRING = "Server=sql.example.com;Database=IdentityServer;User Id=identityserver_migrator;Password=...;Encrypt=True"
duende storage migrate --provider mssql --dry-run
duende storage migrate --provider mssql
```

PostgreSQL:

```powershell
# Terminal
$env:DUENDE_STORAGE_CONNECTION_STRING = "Host=db.example.com;Database=identityserver;Username=identityserver_migrator;Password=...;SSL Mode=VerifyFull"
duende storage migrate --provider postgresql --dry-run
duende storage migrate --provider postgresql
```

SQLite:

```powershell
# Terminal
$env:DUENDE_STORAGE_CONNECTION_STRING = "Data Source=identityserver.db"
duende storage migrate --provider sqlite --dry-run
duende storage migrate --provider sqlite
```

Running `duende storage migrate --provider sqlite --connection-string "Data Source=identityserver.db" --dry-run`
against a fresh database prints the schema version, then the migration SQL (trimmed here for length):

```text
Connecting to sqlite database...
Current schema version: 0
Required schema version: 2
-- Migration step: V0 → V1
-- V0 → V1: initial schema creation
...
CREATE TABLE IF NOT EXISTS __schema_info (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
...
Dry run complete. No changes were made.
```

Running the same command without `--dry-run` applies the migration:

```text
Connecting to sqlite database...
Current schema version: 0
Required schema version: 2
Migrating from version 0 to version 2...
Migration complete. Schema is now at version 2.
```

Running it again once the schema is current is a no-op:

```text
Connecting to sqlite database...
Current schema version: 2
Required schema version: 2
Schema is already up to date (version 2).
```

Passing `--schema` with `--provider sqlite` is an error, because SQLite doesn't support schemas:

```text
sqlite does not support database schemas.
```

If you run Duende Storage against multiple database instances (for example separate databases for IdentityServer and
User Management), run `storage migrate` once per connection string. See
[Multiple Storage Instances](/identityserver/data/providers/duende-storage/multiple-storage-instances.md).

For project-context version detection to work, run `storage migrate` from the folder of a restored project that
references `Duende.Storage` directly or through any provider package (`Duende.Storage.MsSql`,
`Duende.Storage.PostgreSql`, `Duende.Storage.Oracle`, or `Duende.Storage.Sqlite`). If you run the CLI somewhere
without that project context, such as a deployment agent that only has the CLI installed, pass `--plugin-version`
explicitly instead.

### plugin list

Lists the plugins the CLI knows about and, when run from a restored project, the version it would resolve for each.

```powershell
# Terminal
duende plugin list
```

### plugin cache clear

Clears the NuGet global packages cache entries for Duende plugins.

```powershell
# Terminal
duende plugin cache clear
```

Use it to force the CLI to re-download a plugin, for example after a corrupted or incomplete download.

### version

Shows the Duende CLI version.

```powershell
# Terminal
duende version
```

## Global Options

These options apply to every `duende` command:

* `--plugin-path <plugin-path>`: load a plugin directly from a DLL path, bypassing NuGet resolution.
* `--plugin-version <plugin-version>`: specify the plugin version to download (for example `2.0.0-preview.3`). Use it
  when there's no project context to detect a version from, or to pin a specific version.

## Environment Variables

* `DUENDE_STORAGE_CONNECTION_STRING`: the connection string `storage migrate` uses when you don't pass
  `--connection-string`. Prefer it over `--connection-string`, so the connection string, which may contain a
  password, doesn't end up in your shell history or process list.
* `NUGET_PACKAGES`: the NuGet global packages folder. The CLI caches the downloaded storage plugin under
  `<NUGET_PACKAGES>/duende.storage.cliplugin/<version>/`, so setting `NUGET_PACKAGES` changes where the cache lives.

## Exit Codes

* `0`: success, including when the schema was already up to date and when `--dry-run` completed.
* `1`: any error, including an unknown provider, a missing connection string, a database newer than the tool
  understands, or `--schema` combined with `--provider sqlite`.

Error messages redact connection-string values.

## Related Pages

* [Getting Started with Duende Storage](/identityserver/data/providers/duende-storage/getting-started.md)
* [Create and Upgrade the Schema](/identityserver/data/providers/duende-storage/databases/index.mdx#create-and-upgrade-the-schema)
* [SQL Server](/identityserver/data/providers/duende-storage/databases/sql-server.md)
* [PostgreSQL](/identityserver/data/providers/duende-storage/databases/postgresql.md)
* [Oracle](/identityserver/data/providers/duende-storage/databases/oracle.md)
* [SQLite](/identityserver/data/providers/duende-storage/databases/sqlite.md)
