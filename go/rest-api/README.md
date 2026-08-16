# Go REST API

A minimal REST API and browser UI built only with the Go standard library.

## Run

```sh
go run .
```

The server listens on `:8080`. Stop it with `Ctrl+C`; active requests are given
up to 10 seconds to finish.

Open [http://localhost:8080](http://localhost:8080) to view the browser UI. Its
static HTML, CSS, and JavaScript files are served from `web/` by the Go server.

## Endpoint

```sh
curl http://localhost:8080/health
```

Response:

```json
{"status":"ok"}
```

### List projects

```sh
curl http://localhost:8080/api/projects
```

The endpoint returns direct child projects in the parent `codex` repository.
Projects with `index.html` are reported as `web`; projects with `go.mod` are
reported as `go`. Set `CODEX_REPOSITORY_ROOT` when the repository is not two
directories above the process working directory.

Logs are emitted as JSON to standard output, which makes them easy to collect
and query in production environments.
