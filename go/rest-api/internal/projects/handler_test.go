package projects

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestNewHandlerListsProjects(t *testing.T) {
	t.Parallel()

	repositoryRoot := t.TempDir()
	createProjectFile(t, repositoryRoot, "zeta", "index.html")
	createProjectFile(t, repositoryRoot, "alpha", "go.mod")
	createProjectFile(t, repositoryRoot, "not-a-project", "README.md")
	createProjectFile(t, repositoryRoot, ".private", "index.html")

	request := httptest.NewRequest(http.MethodGet, "/api/projects", nil)
	recorder := httptest.NewRecorder()
	NewHandler(repositoryRoot).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	if contentType := recorder.Header().Get("Content-Type"); contentType != "application/json; charset=utf-8" {
		t.Fatalf("Content-Type = %q, want application/json; charset=utf-8", contentType)
	}
	want := "{\"projects\":[{\"name\":\"alpha\",\"path\":\"alpha\",\"type\":\"go\"},{\"name\":\"zeta\",\"path\":\"zeta\",\"type\":\"web\"}]}\n"
	if body := recorder.Body.String(); body != want {
		t.Fatalf("body = %q, want %q", body, want)
	}
}

func TestNewHandlerReturnsInternalServerErrorWhenRootIsUnavailable(t *testing.T) {
	t.Parallel()

	request := httptest.NewRequest(http.MethodGet, "/api/projects", nil)
	recorder := httptest.NewRecorder()
	NewHandler(filepath.Join(t.TempDir(), "missing")).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusInternalServerError)
	}
}

func createProjectFile(t *testing.T, root, name, filename string) {
	t.Helper()
	directory := filepath.Join(root, name)
	if err := os.Mkdir(directory, 0o755); err != nil {
		t.Fatalf("create project directory: %v", err)
	}
	if err := os.WriteFile(filepath.Join(directory, filename), nil, 0o644); err != nil {
		t.Fatalf("create project file: %v", err)
	}
}
