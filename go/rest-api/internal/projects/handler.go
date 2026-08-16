// Package projects exposes metadata for projects in the parent codex repository.
package projects

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
)

// Project is metadata for a single direct child project of the repository root.
type Project struct {
	Name         string   `json:"name"`
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	Category     string   `json:"category"`
	Image        string   `json:"image"`
	Technologies []string `json:"technologies"`
	Featured     bool     `json:"featured"`
	Status       string   `json:"status"`
	Type         string   `json:"type"`
	URL          string   `json:"url"`
}

// projectMetadata contains optional UI fields read from a project's project.json.
// Pointers distinguish an omitted field from an explicitly empty value.
type projectMetadata struct {
	Title        *string   `json:"title"`
	Description  *string   `json:"description"`
	Category     *string   `json:"category"`
	Image        *string   `json:"image"`
	Technologies *[]string `json:"technologies"`
	Featured     *bool     `json:"featured"`
	Status       *string   `json:"status"`
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

		project := Project{
			Name:         entry.Name(),
			Title:        entry.Name(),
			Technologies: make([]string, 0),
			// The detected type is a useful default UI category for projects
			// that have not yet opted into project.json.
			Category: projectType,
			Type:     projectType,
			URL:      "/projects/" + url.PathEscape(entry.Name()) + "/",
		}

		metadata, exists, err := readMetadata(filepath.Join(repositoryRoot, entry.Name()))
		if err != nil {
			return nil, fmt.Errorf("read metadata for %q: %w", entry.Name(), err)
		}
		if exists {
			if err := applyMetadata(&project, metadata); err != nil {
				return nil, fmt.Errorf("apply metadata for %q: %w", entry.Name(), err)
			}
		}
		projects = append(projects, project)
	}

	sort.Slice(projects, func(i, j int) bool { return projects[i].Name < projects[j].Name })
	return projects, nil
}

func readMetadata(directory string) (projectMetadata, bool, error) {
	metadataPath := filepath.Join(directory, "project.json")
	info, err := os.Lstat(metadataPath)
	if errors.Is(err, os.ErrNotExist) {
		return projectMetadata{}, false, nil
	}
	if err != nil {
		return projectMetadata{}, false, err
	}
	if !info.Mode().IsRegular() {
		return projectMetadata{}, false, errors.New("project.json must be a regular file")
	}

	contents, err := os.ReadFile(metadataPath)
	if err != nil {
		return projectMetadata{}, false, err
	}
	if contents = bytes.TrimSpace(contents); len(contents) == 0 || contents[0] != '{' {
		return projectMetadata{}, false, errors.New("project.json must contain a JSON object")
	}
	var metadata projectMetadata
	if err := json.Unmarshal(contents, &metadata); err != nil {
		return projectMetadata{}, false, fmt.Errorf("invalid project.json: %w", err)
	}
	return metadata, true, nil
}

func applyMetadata(project *Project, metadata projectMetadata) error {
	if metadata.Title != nil {
		project.Title = *metadata.Title
	}
	if metadata.Description != nil {
		project.Description = *metadata.Description
	}
	if metadata.Category != nil {
		project.Category = *metadata.Category
	}
	if metadata.Image != nil {
		imageURL, err := projectAssetURL(project.Name, *metadata.Image)
		if err != nil {
			return err
		}
		project.Image = imageURL
	}
	if metadata.Technologies != nil {
		project.Technologies = *metadata.Technologies
	}
	if metadata.Featured != nil {
		project.Featured = *metadata.Featured
	}
	if metadata.Status != nil {
		project.Status = *metadata.Status
	}
	return nil
}

// projectAssetURL converts a project-relative metadata asset path into the
// existing protected project-file route. Empty values deliberately mean no image.
func projectAssetURL(projectName, assetPath string) (string, error) {
	if assetPath == "" {
		return "", nil
	}

	parts := strings.Split(assetPath, "/")
	escapedParts := make([]string, 0, len(parts))
	for _, part := range parts {
		if part == "" || part == "." || part == ".." || strings.Contains(part, "\\") {
			return "", errors.New("image must be a safe project-relative path")
		}
		escapedParts = append(escapedParts, url.PathEscape(part))
	}
	return "/projects/" + url.PathEscape(projectName) + "/" + strings.Join(escapedParts, "/"), nil
}

// NewPageHandler serves browser files belonging to known projects below /projects/.
// It expects the full request path so it can validate both the project name and
// any nested asset path before accessing the repository filesystem.
func NewPageHandler(repositoryRoot string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		projectName, filePath, ok := requestedFile(r.URL.Path)
		if !ok {
			http.NotFound(w, r)
			return
		}

		file, err := projectFile(repositoryRoot, projectName, filePath)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		http.ServeFile(w, r, file)
	})
}

func requestedFile(requestPath string) (projectName, filePath string, ok bool) {
	const prefix = "/projects/"
	if !strings.HasPrefix(requestPath, prefix) {
		return "", "", false
	}

	parts := strings.Split(strings.TrimPrefix(requestPath, prefix), "/")
	if len(parts) == 0 || !validProjectName(parts[0]) {
		return "", "", false
	}
	if len(parts) == 1 || (len(parts) == 2 && parts[1] == "") {
		return parts[0], "index.html", true
	}
	for _, part := range parts[1:] {
		if part == "" || part == "." || part == ".." || strings.Contains(part, "\\") {
			return "", "", false
		}
	}

	return parts[0], path.Join(parts[1:]...), true
}

func validProjectName(name string) bool {
	return name != "" && name != "." && name != ".." &&
		!strings.HasPrefix(name, ".") && !strings.ContainsAny(name, `/\\`)
}

// projectFile resolves a requested file and confirms it remains within a
// direct, non-symlink project directory after resolving any file symlinks.
func projectFile(repositoryRoot, projectName, filePath string) (string, error) {
	repositoryRoot, err := filepath.EvalSymlinks(repositoryRoot)
	if err != nil {
		return "", err
	}

	projectDirectory := filepath.Join(repositoryRoot, projectName)
	info, err := os.Lstat(projectDirectory)
	if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return "", os.ErrNotExist
	}
	if _, found, err := detectType(projectDirectory); err != nil || !found {
		return "", os.ErrNotExist
	}

	resolvedProjectDirectory, err := filepath.EvalSymlinks(projectDirectory)
	if err != nil {
		return "", err
	}
	resolvedFile, err := filepath.EvalSymlinks(filepath.Join(projectDirectory, filepath.FromSlash(filePath)))
	if err != nil {
		return "", err
	}
	if !within(resolvedProjectDirectory, resolvedFile) {
		return "", os.ErrPermission
	}

	fileInfo, err := os.Stat(resolvedFile)
	if err != nil || !fileInfo.Mode().IsRegular() {
		return "", os.ErrNotExist
	}
	return resolvedFile, nil
}

func within(directory, filename string) bool {
	relativePath, err := filepath.Rel(directory, filename)
	return err == nil && relativePath != ".." && !strings.HasPrefix(relativePath, ".."+string(filepath.Separator))
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
