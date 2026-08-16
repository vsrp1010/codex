// Package projects exposes metadata for projects in the parent codex repository.
package projects

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"sort"
)

// Project is metadata for a single direct child project of the repository root.
type Project struct {
	Name string `json:"name"`
	Path string `json:"path"`
	Type string `json:"type"`
}

type response struct {
	Projects []Project `json:"projects"`
}

type errorResponse struct {
	Error string `json:"error"`
}

// NewHandler returns a handler that reads projects from repositoryRoot. The root
// is injected so the HTTP layer does not rely on a process working directory.
func NewHandler(repositoryRoot string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectList, err := list(repositoryRoot)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errorResponse{Error: "unable to list projects"})
			return
		}

		writeJSON(w, http.StatusOK, response{Projects: projectList})
	})
}

// list returns direct child directories that have a web or Go project entry file.
func list(repositoryRoot string) ([]Project, error) {
	entries, err := os.ReadDir(repositoryRoot)
	if err != nil {
		return nil, err
	}

	projects := make([]Project, 0)
	for _, entry := range entries {
		if !entry.IsDir() || entry.Name()[0] == '.' {
			continue
		}

		projectType, ok, err := detectType(filepath.Join(repositoryRoot, entry.Name()))
		if err != nil {
			return nil, err
		}
		if !ok {
			continue
		}

		projects = append(projects, Project{
			Name: entry.Name(),
			Path: entry.Name(),
			Type: projectType,
		})
	}

	sort.Slice(projects, func(i, j int) bool { return projects[i].Name < projects[j].Name })
	return projects, nil
}

func detectType(directory string) (projectType string, found bool, err error) {
	if _, err := os.Stat(filepath.Join(directory, "go.mod")); err == nil {
		return "go", true, nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return "", false, err
	}
	if _, err := os.Stat(filepath.Join(directory, "index.html")); err == nil {
		return "web", true, nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return "", false, err
	}
	return "", false, nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	// Responses contain only simple exported structs, so encoding cannot fail.
	_ = json.NewEncoder(w).Encode(value)
}
