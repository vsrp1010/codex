// Command rest-api runs a small HTTP service with a health-check endpoint.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/vsrp1010/codex/go/rest-api/internal/health"
	"github.com/vsrp1010/codex/go/rest-api/internal/projects"
)

const (
	defaultAddress    = ":8080"
	shutdownTimeout   = 10 * time.Second
	readHeaderTimeout = 5 * time.Second
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	repositoryRoot, err := codexRepositoryRoot()
	if err != nil {
		logger.Error("determine repository root", "error", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.Handle("GET /health", health.Handler())
	mux.Handle("GET /api/projects", projects.NewHandler(repositoryRoot))
	// FileServer serves index.html at / and the remaining static web assets.
	// The more-specific API and health routes above take precedence.
	mux.Handle("/", http.FileServer(http.Dir("web")))

	server := &http.Server{
		Addr:              defaultAddress,
		Handler:           requestLogger(logger, mux),
		ReadHeaderTimeout: readHeaderTimeout,
		IdleTimeout:       60 * time.Second,
	}

	// NotifyContext cancels the context after SIGINT or SIGTERM is received.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serverErrors := make(chan error, 1)
	go func() {
		logger.Info("server starting", "address", server.Addr)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case err := <-serverErrors:
		if !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server stopped unexpectedly", "error", err)
			os.Exit(1)
		}
	case <-ctx.Done():
		logger.Info("shutdown signal received")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "error", err)
		os.Exit(1)
	}
	logger.Info("server stopped")
}

// codexRepositoryRoot returns the directory containing the projects to expose.
// An explicit environment variable makes deployed locations independent of CWD.
func codexRepositoryRoot() (string, error) {
	if root := os.Getenv("CODEX_REPOSITORY_ROOT"); root != "" {
		return filepath.Abs(root)
	}

	// This default supports `go run .` from this project's directory.
	return filepath.Abs("../..")
}

// requestLogger emits one structured log entry for every completed request.
func requestLogger(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		logger.Info("request completed",
			"method", r.Method,
			"path", r.URL.Path,
			"duration", time.Since(started).String(),
		)
	})
}
