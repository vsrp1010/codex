// Package health provides the service health-check endpoint.
package health

import (
	"encoding/json"
	"net/http"
)

// response is intentionally small so health probes have a stable contract.
type response struct {
	Status string `json:"status"`
}

// Handler returns an HTTP handler that reports the service is available.
func Handler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		// Writing to a ResponseWriter cannot usefully be retried. The payload is
		// static and encoding it cannot fail, so no error response is possible here.
		_ = json.NewEncoder(w).Encode(response{Status: "ok"})
	})
}
