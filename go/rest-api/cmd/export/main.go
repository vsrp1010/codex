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

	outputPath := filepath.Join(repositoryRoot, "docs", "projects.json")
	if err := writeProjectList(outputPath, projectList); err != nil {
		fail("write projects export", err)
	}
}

func writeProjectList(outputPath string, projectList []projects.Project) error {
	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		return err
	}

	output, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer output.Close()

	return projects.WriteListJSON(output, projectList)
}

func fail(operation string, err error) {
	fmt.Fprintf(os.Stderr, "export: %s: %v\n", operation, err)
	os.Exit(1)
}
