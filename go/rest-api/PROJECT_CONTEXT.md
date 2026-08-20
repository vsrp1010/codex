# Project Context: Go Project Dashboard and REST API

## Overview

This project is a Go-based web application inside the larger `codex` repository.

The parent `codex` repository is a general AI playground containing experiments, games, simulations, and interactive showcases.

This sub-project has evolved from a simple REST API experiment into a Go-powered project dashboard and launcher.

The application provides:

* a browser-based dashboard UI
* REST APIs for project discovery
* metadata-driven project descriptions
* controlled launching/serving of projects from the parent repository

The project intentionally uses a lightweight vanilla JavaScript frontend.
During development it is served by Go, while production deployment uses a
static GitHub Pages export.

---

## Parent Repository

Repository:

```
codex
```

Purpose:

* AI experiments
* Interactive showcases
* Games
* Simulations
* Future AI-powered applications

Existing sibling projects include:

```
cellular-life
creature-sim
connect-4
dino-runner
index.html
```

---

## Current Project Location

```
codex/go/rest-api
```

---

## Technology Stack

Language:

```
Go 1.26.4
```

Platform:

```
macOS ARM64
```

Current Go module:

```
github.com/vsrp1010/codex/go/rest-api
```

HTTP framework:

```
Go standard library net/http
```

No external web framework is currently used.

Frontend:

```
HTML
CSS
Vanilla JavaScript
```

No frontend framework is used.

---

## Current Project Structure

```
rest-api/
├── go.mod
├── main.go
├── README.md
├── PROJECT_CONTEXT.md
├── cmd/
│   └── export/
│       └── main.go
├── web/
│   ├── index.html
│   ├── app.js
│   ├── config.js
│   └── style.css
└── internal/
    ├── health/
    │   ├── handler.go
    │   └── handler_test.go
    │
    └── projects/
        ├── handler.go
        └── handler_test.go
```

---

## Application Routes

The application runs:

```
localhost:8080
```

### Health endpoint

```
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

Test:

```bash
curl http://localhost:8080/health
```

---

### Dashboard UI

```
GET /
```

The root route serves the browser dashboard from:

```
web/
```


The dashboard uses vanilla JavaScript to load project metadata and dynamically
render project cards.

`web/config.js` selects the data source:

* Development uses `/api/projects`.
* The static export generates a configuration using `./projects.json`.

The same frontend code supports both the Go-served development environment and
the GitHub Pages static deployment.


### Static Dashboard Export

```
go run ./cmd/export
```

The standalone exporter writes a GitHub Pages-ready dashboard to:

```
codex/docs/
```

It recursively copies `web/`, writes the project API response to
`projects.json`, and switches only the generated frontend configuration to the
static data file. Each discovered launchable project is copied beneath
`docs/projects/`, excluding common development artifacts. The export is built
in a temporary directory before replacing the previous output, so stale files
are removed on every run.

### GitHub Pages Deployment

The public dashboard is deployed using GitHub Pages from the generated
`docs/` directory.

The publishing workflow is:

```bash
./scripts/publish.sh
git add docs/
git commit
git push
```

---

### Project API

```
GET /api/projects
```

Returns metadata about projects discovered in the parent `codex` repository.

Projects are discovered by checking direct child directories.

A project is currently recognized when it contains:

```
index.html
```

or:

```
go.mod
```

The API returns:

* project name
* type
* URL
* optional metadata

---

### Project Launcher

```
GET /projects/{project-name}/
```

This route serves a selected project's web entry point and assets.

Example:

```
/projects/connect-4/
```

serves:

```
codex/connect-4/index.html
```

The parent repository is not exposed as a general static directory.

Only approved project directories are served.

Security protections include:

* traversal prevention
* hidden directory rejection
* symlink escape prevention
* direct-child project validation

---

## Project Metadata

Projects may optionally include:

```
project.json
```

Example:

```json
{
  "title": "Connect Four AI",
  "description": "A Connect Four experiment with AI gameplay",
  "category": "game"
}
```

Metadata fields:

* title
* description
* category
* image (a project-relative preview asset)
* technologies (a list of strings)
* featured (a boolean)
* status (a short lifecycle label)

Projects without metadata continue to work using fallback values derived from:

* directory name
* detected project type

This allows incremental migration of existing projects.

In the Go-served development environment, preview images are exposed through the protected project route. During static export, project assets are copied into the GitHub Pages output so preview images remain available. 
Projects without metadata receive empty image/technologies/status values and `false` for featured.

---

## Current Architecture

The application follows a simple Go service structure.

Entry point:

```
main.go
```

Responsibilities:

* create HTTP server
* configure routes
* configure structured logging
* handle graceful shutdown
* register handlers

Business functionality is organized under:

```
internal/
```

Current packages:

```
internal/health
```

Handles health checks.

```
internal/projects
```

Handles:

* project discovery
* metadata loading
* project API responses
* controlled project file serving

---

## Architecture Overview

```
                 Browser
                    |
                    |
              Dashboard UI
                    |
                    |
          ---------------------
          |                   |
          v                   v

   GET /api/projects     GET /projects/name/

          |                   |
          v                   v

 Project Metadata       Project Files

          |
          |
    codex repository
```

---

## Design Principles

Prefer:

* Go standard library where practical
* simple maintainable architecture
* clear separation of responsibilities
* small focused packages
* incremental evolution
* readable code over unnecessary abstraction

Avoid:

* introducing frameworks without clear benefit
* premature microservice patterns
* unnecessary dependencies
* over-engineering

---

## Development Workflow

Primary development tools:

* VS Code
* ChatGPT for architecture discussions and planning
* VS Code coding assistants (Codex/Copilot) for implementation

Workflow:

1. Discuss architecture and design decisions.
2. Update PROJECT_CONTEXT.md after meaningful decisions.
3. Use VS Code coding assistants to implement approved changes.
4. Run tests locally.
5. Update documentation/context as the project evolves.

To test and regenerate the GitHub Pages site locally, run this from the
repository root:

```bash
./scripts/publish.sh
```

The helper runs `go test ./...` and `go run ./cmd/export` from `go/rest-api`.
It does not create commits or push changes. Review the generated `docs/`
changes, then commit and push them manually when ready.

---

## Planned Evolution

Possible future capabilities:

* dashboard UI improvements
* featured project sections
* search and filtering by category or technology
* richer project presentation
* AI-powered project discovery
* API integrations
* authentication if needed
* richer frontend only if complexity requires it

The project should continue evolving as a lightweight Go-powered platform for
launching and exploring AI experiments.
---

## Current Development Status

Completed:

* Go environment configured
* Go module created
* HTTP server implemented
* Health endpoint implemented
* Graceful shutdown implemented
* Structured request logging implemented
* Browser dashboard implemented
* Project discovery API implemented
* Project launcher route implemented
* Safe project file serving implemented
* Optional project metadata support implemented
* API and handler tests added
* Static GitHub Pages dashboard export implemented
* Exported project assets copied for static deployment
* GitHub Pages deployment configured
* Publish workflow automated through `scripts/publish.sh`

Next likely milestones:

1. Improve dashboard UI/UX using existing metadata.
2. Add featured project presentation.
3. Add search and filtering capabilities.
4. Improve project cards and visual presentation.
5. Add AI-specific capabilities.

---

## Coding Conventions

Use:

* standard Go formatting (`gofmt`)
* idiomatic Go naming
* explicit error handling
* small packages
* tests alongside implementation where appropriate

When adding functionality:

Prefer:

```
internal/<feature>/
    handler.go
    handler_test.go
```

over putting logic into `main.go`.

---

## Important Notes for AI Coding Assistants

Before making changes:

* read this file first
* preserve existing architecture
* explain significant architectural changes before implementation
* avoid adding dependencies without justification
* keep changes incremental

When generating code:

* include file paths
* explain why files are created or modified
* include test instructions
* maintain compatibility with Go 1.26.4
