# Project Context: Go REST API Experiment

## Overview

This project is a Go-based REST API experiment inside the larger `codex` repository.

The parent `codex` repository is a general AI playground containing various experiments and showcases, including games, simulations, and AI-related projects.

This sub-project focuses on learning and building a maintainable Go HTTP service that can eventually provide APIs and a web interface for interacting with projects in the `codex` repository.

The project will initially use a Go-served frontend rather than a separate frontend framework.

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

---

## Current Project Structure

```
rest-api/
├── go.mod
├── main.go
├── README.md
├── PROJECT_CONTEXT.md
├── web/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── internal/
    └── health/
        ├── handler.go
        └── handler_test.go
```

---

## Current Application Behavior

The application starts an HTTP server:

```
localhost:8080
```

Current endpoint:

```
GET /health
GET /api/projects
```

The root route (`GET /`) serves a small browser UI from `web/`. Its plain
JavaScript calls `GET /api/projects` to display the repository projects.

Response:

```json
{
  "status": "ok"
}
```

Example test:

```bash
curl http://localhost:8080/health
```

---

## Current Architecture

The application follows a simple Go service structure.

Entry point:

```
main.go
```

Responsibilities:

* create HTTP server
* configure routing
* configure structured logging
* handle graceful shutdown
* register HTTP handlers

Handlers are organized under:

```
internal/
```

Current handler:

```
internal/health
```

Project metadata handler:

```
internal/projects
```

`GET /api/projects` lists direct child projects of the codex repository. A
project is a directory containing `index.html` (type `web`) or `go.mod` (type
`go`). The repository root is configured through `CODEX_REPOSITORY_ROOT`; when
unset, local development defaults to two directories above the API directory.

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

* introducing frameworks without a clear benefit
* premature microservice patterns
* unnecessary complexity

---

## Development Workflow

Primary development tools:

* VS Code
* Codex plugin for code generation
* ChatGPT for architecture/design discussions

Workflow:

1. Discuss architecture and design decisions.
2. Update PROJECT_CONTEXT.md when important decisions are made.
3. Use Codex plugin to implement changes.
4. Test locally.
5. Update documentation/context as the project evolves.

---

## Planned Evolution

The project may evolve toward:

```
Browser UI
    |
    |
Go HTTP API
    |
    |
Project metadata / AI experiments
```

Potential future capabilities:

* expose information about projects inside the parent `codex` repository
* provide APIs for AI demos
* provide a web dashboard
* serve HTML/CSS/JavaScript frontend
* integrate AI-related functionality

---

## Current Development Status

Completed:

* Go environment configured
* Go module created
* HTTP server running
* Health endpoint implemented
* Graceful shutdown implemented
* Structured request logging implemented
* Go-served frontend shell implemented

Next likely milestones:

1. Add additional API endpoints.
2. Establish handler/model organization.
3. Add JSON response models.
4. Add tests for new endpoints.
5. Add frontend UI integration.

---

## Coding Conventions

Use:

* standard Go formatting (`gofmt`)
* idiomatic Go naming
* explicit error handling
* small packages
* tests alongside implementation where appropriate

When adding new functionality:

Prefer:

```
internal/<feature>/
    handler.go
    handler_test.go
```

over putting all code into `main.go`.

---

## Important Notes for AI Coding Assistants

Before making changes:

* read this file first
* preserve the existing architecture
* explain significant architectural changes before implementing them
* avoid adding dependencies unless justified
* keep changes small and incremental

When generating code:

* include file paths
* explain why files are created or modified
* include test instructions
* maintain compatibility with Go 1.26.4
