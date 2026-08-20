// Command export writes the project API response as a static GitHub Pages file.
package main

import (
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/vsrp1010/codex/go/rest-api/internal/projects"
)

func main() {
	// The exporter is run from the rest-api module, so the codex repository is
	// two directories above its working directory.
	repositoryRoot, err := filepath.Abs("../..")
	if err != nil {
		fail("determine repository root", err)
	}

	projectList, err := projects.List(repositoryRoot)
	if err != nil {
		fail("list projects", err)
	}

	outputDirectory := filepath.Join(repositoryRoot, "docs")
	if err := exportDashboard(outputDirectory, projectList); err != nil {
		fail("export dashboard", err)
	}
}

// exportDashboard creates the complete static site in a temporary directory
// before replacing the previous export. CopyFS preserves the full web/ tree,
// including assets added by future dashboard changes.
func exportDashboard(outputDirectory string, projectList []projects.Project) error {
	temporaryDirectory, err := os.MkdirTemp(filepath.Dir(outputDirectory), ".docs-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(temporaryDirectory)

	if err := os.CopyFS(temporaryDirectory, os.DirFS("web")); err != nil {
		return err
	}
	staticProjects := staticProjectList(projectList, filepath.Base(outputDirectory))
	if err := copyProjectDirectories(filepath.Join(temporaryDirectory, "projects"), filepath.Dir(outputDirectory), staticProjects); err != nil {
		return err
	}
	if err := writeProjectList(filepath.Join(temporaryDirectory, "projects.json"), staticProjects); err != nil {
		return err
	}
	if err := writeStaticConfig(filepath.Join(temporaryDirectory, "config.js")); err != nil {
		return err
	}

	if err := os.RemoveAll(outputDirectory); err != nil {
		return err
	}
	return os.Rename(temporaryDirectory, outputDirectory)
}

func copyProjectDirectories(outputDirectory, repositoryRoot string, projectList []projects.Project) error {
	for _, project := range projectList {
		sourceDirectory := filepath.Join(repositoryRoot, project.Name)
		destinationDirectory := filepath.Join(outputDirectory, project.Name)
		if err := copyProjectDirectory(sourceDirectory, destinationDirectory); err != nil {
			return fmt.Errorf("copy project %q: %w", project.Name, err)
		}
	}
	return nil
}

func copyProjectDirectory(sourceDirectory, destinationDirectory string) error {
	return filepath.WalkDir(sourceDirectory, func(sourcePath string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}

		relativePath, err := filepath.Rel(sourceDirectory, sourcePath)
		if err != nil {
			return err
		}
		if relativePath != "." && excludedProjectPath(relativePath) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}

		destinationPath := filepath.Join(destinationDirectory, relativePath)
		if entry.IsDir() {
			return os.MkdirAll(destinationPath, 0o755)
		}
		if !entry.Type().IsRegular() {
			return fmt.Errorf("unsupported file type at %q", sourcePath)
		}
		return copyProjectFile(sourcePath, destinationPath, entry)
	})
}

func copyProjectFile(sourcePath, destinationPath string, entry os.DirEntry) error {
	info, err := entry.Info()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(destinationPath), 0o755); err != nil {
		return err
	}

	source, err := os.Open(sourcePath)
	if err != nil {
		return err
	}
	defer source.Close()

	destination, err := os.OpenFile(destinationPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, info.Mode().Perm())
	if err != nil {
		return err
	}
	if _, err := io.Copy(destination, source); err != nil {
		_ = destination.Close()
		return err
	}
	return destination.Close()
}

func excludedProjectPath(relativePath string) bool {
	excludedNames := map[string]struct{}{
		".git":         {},
		".github":      {},
		".vscode":      {},
		"node_modules": {},
		"bin":          {},
		"dist":         {},
	}
	for _, name := range strings.Split(filepath.ToSlash(relativePath), "/") {
		if _, excluded := excludedNames[name]; excluded {
			return true
		}
	}
	return false
}

func staticProjectList(projectList []projects.Project, dashboardName string) []projects.Project {
	staticProjects := make([]projects.Project, 0, len(projectList))
	for _, project := range projectList {
		if project.Name == dashboardName {
			continue
		}

		project.URL = staticProjectURL(project.Name)
		project.Image = staticImageURL(project.Name, project.Image)
		staticProjects = append(staticProjects, project)
	}
	return staticProjects
}

func staticProjectURL(projectName string) string {
	return "./projects/" + url.PathEscape(projectName) + "/"
}

func staticImageURL(projectName, imageURL string) string {
	if imageURL == "" {
		return ""
	}

	developmentPrefix := "/projects/" + url.PathEscape(projectName) + "/"
	if !strings.HasPrefix(imageURL, developmentPrefix) {
		return imageURL
	}
	return "." + imageURL
}

func writeProjectList(outputPath string, projectList []projects.Project) error {
	output, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	if err := projects.WriteListJSON(output, projectList); err != nil {
		_ = output.Close()
		return err
	}
	return output.Close()
}

func writeStaticConfig(outputPath string) error {
	const staticConfig = "window.codexDashboardConfig = { projectsURL: \"./projects.json\" };\n"
	return os.WriteFile(outputPath, []byte(staticConfig), 0o644)
}

func fail(operation string, err error) {
	fmt.Fprintf(os.Stderr, "export: %s: %v\n", operation, err)
	os.Exit(1)
}
