package main

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/vsrp1010/codex/go/rest-api/internal/projects"
)

func TestStaticProjectListFiltersDashboardAndRewritesURLs(t *testing.T) {
	projectList := []projects.Project{
		{
			Name:  "docs",
			URL:   "/projects/docs/",
			Image: "/projects/docs/assets/dashboard.png",
		},
		{
			Name:  "connect-4",
			URL:   "/projects/connect-4/",
			Image: "/projects/connect-4/assets/preview.jpg",
		},
		{
			Name:  "creature-sim",
			URL:   "/projects/creature-sim/",
			Image: "",
		},
	}

	got := staticProjectList(projectList, "docs")
	want := []projects.Project{
		{
			Name:  "connect-4",
			URL:   "./projects/connect-4/",
			Image: "./projects/connect-4/assets/preview.jpg",
		},
		{
			Name:  "creature-sim",
			URL:   "./projects/creature-sim/",
			Image: "",
		},
	}

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("staticProjectList() = %#v, want %#v", got, want)
	}
}

func TestStaticProjectListEscapesProjectNames(t *testing.T) {
	projectList := []projects.Project{{
		Name:  "space project",
		URL:   "/projects/space%20project/",
		Image: "/projects/space%20project/assets/preview.png",
	}}

	got := staticProjectList(projectList, "docs")
	if got[0].URL != "./projects/space%20project/" {
		t.Fatalf("URL = %q, want %q", got[0].URL, "./projects/space%20project/")
	}
	if got[0].Image != "./projects/space%20project/assets/preview.png" {
		t.Fatalf("Image = %q, want %q", got[0].Image, "./projects/space%20project/assets/preview.png")
	}
}

func TestCopyProjectDirectoryPreservesFilesAndSkipsDevelopmentArtifacts(t *testing.T) {
	sourceDirectory := t.TempDir()
	destinationDirectory := filepath.Join(t.TempDir(), "project")

	writeTestFile(t, filepath.Join(sourceDirectory, "index.html"), "<main />")
	writeTestFile(t, filepath.Join(sourceDirectory, "assets", "preview.jpg"), "preview")
	for _, excludedName := range []string{".git", ".github", ".vscode", "node_modules", "bin", "dist"} {
		writeTestFile(t, filepath.Join(sourceDirectory, "nested", excludedName, "ignored.txt"), "ignored")
	}

	if err := copyProjectDirectory(sourceDirectory, destinationDirectory); err != nil {
		t.Fatalf("copyProjectDirectory() error = %v", err)
	}

	assertTestFile(t, filepath.Join(destinationDirectory, "index.html"), "<main />")
	assertTestFile(t, filepath.Join(destinationDirectory, "assets", "preview.jpg"), "preview")
	for _, excludedName := range []string{".git", ".github", ".vscode", "node_modules", "bin", "dist"} {
		path := filepath.Join(destinationDirectory, "nested", excludedName)
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			t.Errorf("excluded path %q exists or returned unexpected error: %v", path, err)
		}
	}
}

func writeTestFile(t *testing.T, path, contents string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("create test directory: %v", err)
	}
	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatalf("write test file: %v", err)
	}
}

func assertTestFile(t *testing.T, path, want string) {
	t.Helper()
	contents, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read copied file %q: %v", path, err)
	}
	if string(contents) != want {
		t.Errorf("contents of %q = %q, want %q", path, contents, want)
	}
}
