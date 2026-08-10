// demo_go.go
// Upload this file to see Go syntax highlighting
// Keywords: blue | Strings: orange | Comments: green | Types: cyan

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// UserProfile represents a user in the system.
type UserProfile struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	Tags      []string  `json:"tags,omitempty"`
}

const (
	maxRetries     = 3
	requestTimeout = 30 * time.Second
)

// FetchUser retrieves a user profile from the API with retry logic.
func FetchUser(userID int) (*UserProfile, error) {
	url := fmt.Sprintf("https://api.txttoimage.app/v1/users/%d", userID)

	for attempt := 1; attempt <= maxRetries; attempt++ {
		resp, err := http.Get(url)
		if err != nil {
			fmt.Printf("Attempt %d/%d failed: %v\n", attempt, maxRetries, err)
			if attempt == maxRetries {
				return nil, fmt.Errorf("max retries exceeded: %w", err)
			}
			time.Sleep(time.Second)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusNotFound {
			return nil, nil
		}

		var profile UserProfile
		if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
			return nil, fmt.Errorf("failed to decode response: %w", err)
		}
		return &profile, nil
	}
	return nil, nil
}

func main() {
	profile, err := FetchUser(42)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Printf("Profile: %+v\n", profile)
}
