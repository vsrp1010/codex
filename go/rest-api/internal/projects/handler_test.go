package projects

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestNewHandlerUsesFallbackWithoutMetadata(t *testing.T) {
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
	want := "{\"projects\":[{\"name\":\"alpha\",\"title\":\"alpha\",\"description\":\"\",\"category\":\"go\",\"image\":\"\",\"technologies\":[],\"featured\":false,\"status\":\"\",\"type\":\"go\",\"url\":\"/projects/alpha/\"},{\"name\":\"zeta\",\"title\":\"zeta\",\"description\":\"\",\"category\":\"web\",\"image\":\"\",\"technologies\":[],\"featured\":false,\"status\":\"\",\"type\":\"web\",\"url\":\"/projects/zeta/\"}]}\n"
	if body := recorder.Body.String(); body != want {
		t.Fatalf("body = %q, want %q", body, want)
	}
}

func TestNewHandlerUsesProjectMetadata(t *testing.T) {
	t.Parallel()

	repositoryRoot := t.TempDir()
	createProjectFile(t, repositoryRoot, "connect-4", "index.html")
	createProjectMetadata(t, repositoryRoot, "connect-4", `{
  "title": "Connect 4",
  "description": "A browser implementation of the classic game.",
  "category": "games",
  "image": "assets/preview.png",
  "technologies": ["JavaScript", "Canvas"],
  "featured": true,
  "status": "active"
}`)

	recorder := httptest.NewRecorder()
	NewHandler(repositoryRoot).ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/projects", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
	want := "{\"projects\":[{\"name\":\"connect-4\",\"title\":\"Connect 4\",\"description\":\"A browser implementation of the classic game.\",\"category\":\"games\",\"image\":\"/projects/connect-4/assets/preview.png\",\"technologies\":[\"JavaScript\",\"Canvas\"],\"featured\":true,\"status\":\"active\",\"type\":\"web\",\"url\":\"/projects/connect-4/\"}]}\n"
	if body := recorder.Body.String(); body != want {
		t.Fatalf("body = %q, want %q", body, want)
	}
}

func TestNewHandlerReturnsInternalServerErrorForUnsafeMetadataImage(t *testing.T) {
	t.Parallel()

	repositoryRoot := t.TempDir()
	createProjectFile(t, repositoryRoot, "unsafe", "index.html")
	createProjectMetadata(t, repositoryRoot, "unsafe", `{"image":"../secret.png"}`)

	recorder := httptest.NewRecorder()
	NewHandler(repositoryRoot).ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/projects", nil))

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusInternalServerError)
	}
}

func TestNewHandlerReturnsInternalServerErrorForInvalidMetadata(t *testing.T) {
	t.Parallel()

	repositoryRoot := t.TempDir()
	createProjectFile(t, repositoryRoot, "broken", "index.html")
	createProjectMetadata(t, repositoryRoot, "broken", `{not valid json}`)

	recorder := httptest.NewRecorder()
	NewHandler(repositoryRoot).ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/api/projects", nil))

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusInternalServerError)
	}
	if body := recorder.Body.String(); body != "{\"error\":\"unable to list projects\"}\n" {
		t.Fatalf("body = %q, want generic API error", body)
	}
}

func TestNewPageHandlerServesProjectFiles(t *testing.T) {
	t.Parallel()

	repositoryRoot := t.TempDir()
	createProjectFile(t, repositoryRoot, "demo", "index.html")
	if err := os.WriteFile(filepath.Join(repositoryRoot, "demo", "app.js"), []byte("console.log('demo');"), 0o644); err != nil {
		t.Fatalf("create project asset: %v", err)
	}
	handler := NewPageHandler(repositoryRoot)

	for _, test := range []struct {
		path string
		want string
	}{
		{path: "/projects/demo/", want: ""},
		{path: "/projects/demo/app.js", want: "console.log('demo');"},
	} {
		t.Run(test.path, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, test.path, nil))
			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
			}
			if body := recorder.Body.String(); body != test.want {
				t.Fatalf("body = %q, want %q", body, test.want)
			}
		})
	}
}

func TestNewPageHandlerRejectsInvalidRequests(t *testing.T) {
	t.Parallel()

	repositoryRoot := t.TempDir()
	createProjectFile(t, repositoryRoot, "demo", "index.html")
	handler := NewPageHandler(repositoryRoot)

	for _, requestPath := range []string{
		"/projects/unknown/",
		"/projects/.private/",
		"/projects/demo/../secret.txt",
		"/projects/demo/",
	} {
		t.Run(requestPath, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, requestPath, nil))
			if recorder.Code != http.StatusMethodNotAllowed {
				t.Fatalf("POST status = %d, want %d", recorder.Code, http.StatusMethodNotAllowed)
			}
		})
	}

	for _, requestPath := range []string{
		"/projects/unknown/",
		"/projects/.private/",
		"/projects/demo/../secret.txt",
	} {
		t.Run(requestPath+" GET", func(t *testing.T) {
			recorder := httptest.NewRecorder()
			handler.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, requestPath, nil))
			if recorder.Code != http.StatusNotFound {
				t.Fatalf("GET status = %d, want %d", recorder.Code, http.StatusNotFound)
			}
		})
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

func createProjectMetadata(t *testing.T, root, name, contents string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(root, name, "project.json"), []byte(contents), 0o644); err != nil {
		t.Fatalf("create project metadata: %v", err)
	}
}
