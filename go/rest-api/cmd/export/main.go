// Command export writes the project API response as a static GitHub Pages file.
package main

import (
	"fmt"
	"os"
	"path/filepath"

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
	if err := writeProjectList(filepath.Join(temporaryDirectory, "projects.json"), projectList); err != nil {
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
