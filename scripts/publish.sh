#!/bin/sh

set -eu

repository_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$repository_root/go/rest-api"

go test ./...
go run ./cmd/export