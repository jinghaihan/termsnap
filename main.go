package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"
	"unicode/utf8"

	"github.com/creack/pty"
	"github.com/gorilla/websocket"
	"golang.org/x/term"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow cross-origin
	},
}

type WebSocketMessage struct {
	Type      string `json:"type"`
	Data      string `json:"data"`
	Timestamp int64  `json:"timestamp"`
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
		return
	}
	defer conn.Close()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}

		var message WebSocketMessage
		if err := json.Unmarshal(msgBytes, &message); err != nil {
			log.Println("JSON unmarshal error:", err)
			continue
		}

		if message.Type == "command" {
			// Execute the command
			go executeCommand(conn, message.Data)
		} else if message.Type == "input" {
			// Handle user input - this will be forwarded to the pty
			go handleUserInput(conn, message.Data)
		}
	}
}

var currentPty *os.File
var currentCmd *exec.Cmd

func executeCommand(conn *websocket.Conn, command string) {
	// Use bash to execute the command to handle shell syntax like process substitution
	cmd := exec.Command("bash", "-c", command)
	currentCmd = cmd
	
	// Set up environment variables for better terminal compatibility
	cmd.Env = append(os.Environ(),
		"TERM=xterm-256color",
		"COLORTERM=truecolor",
		"FORCE_COLOR=1",
	)
	
	ptmx, err := pty.Start(cmd)
	if err != nil {
		log.Println("Start pty error:", err)
		sendMessage(conn, "error", err.Error())
		return
	}
	currentPty = ptmx
	defer func() {
		_ = ptmx.Close()
		_ = cmd.Process.Kill()
		currentPty = nil
		currentCmd = nil
	}()

	// Set terminal size to a larger default for better display
	pty.Setsize(ptmx, &pty.Winsize{
		Rows: 40,
		Cols: 120,
	})

	// Read output from pty with better buffering and encoding
	go func() {
		buf := make([]byte, 4096) // Increased buffer size
		for {
			n, err := ptmx.Read(buf)
			if err != nil {
				log.Println("pty read error:", err)
				break
			}
			if n > 0 {
				// Process the output with proper UTF-8 encoding
				output := string(buf[:n])
				
				// Handle potential encoding issues by ensuring UTF-8
				outputBytes := []byte(output)
				if !utf8.Valid(outputBytes) {
					// If not valid UTF-8, try to convert from common encodings
					output = string(bytes.ToValidUTF8(outputBytes, []byte("")))
				}
				
				sendMessage(conn, "output", output)
			}
		}
	}()

	// Wait for command to complete
	err = cmd.Wait()
	if err != nil {
		// Send exit code instead of error message for better CLI handling
		if exitError, ok := err.(*exec.ExitError); ok {
			sendMessage(conn, "exit", fmt.Sprintf("%d", exitError.ExitCode()))
		} else {
			sendMessage(conn, "exit", "1")
		}
	} else {
		sendMessage(conn, "exit", "0")
	}
}

func handleUserInput(conn *websocket.Conn, input string) {
	if currentPty != nil {
		// Write user input to the pty
		_, err := currentPty.Write([]byte(input))
		if err != nil {
			log.Println("Failed to write to pty:", err)
		}
	}
}

func sendMessage(conn *websocket.Conn, msgType, data string) {
	message := WebSocketMessage{
		Type:      msgType,
		Data:      data,
		Timestamp: time.Now().UnixMilli(),
	}
	
	msgBytes, err := json.Marshal(message)
	if err != nil {
		log.Println("JSON marshal error:", err)
		return
	}
	
	err = conn.WriteMessage(websocket.TextMessage, msgBytes)
	if err != nil {
		log.Println("WebSocket write error:", err)
	}
}

func main() {
	port := flag.String("port", "8080", "port to listen on")
	flag.Parse()

	addr := fmt.Sprintf(":%s", *port)
	fmt.Printf("Go terminal proxy running on %s/ws\n", addr)

	http.HandleFunc("/ws", handleWS)

	// Set up terminal for better interactive command handling
	if term.IsTerminal(int(os.Stdin.Fd())) {
		oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
		if err == nil {
			defer term.Restore(int(os.Stdin.Fd()), oldState)
		}
	}

	// Create server with timeout
	server := &http.Server{
		Addr:         addr,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan
		
		// Cleanup current command if running
		if currentCmd != nil && currentCmd.Process != nil {
			currentCmd.Process.Kill()
		}
		if currentPty != nil {
			currentPty.Close()
		}
		
		// Shutdown server gracefully
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		server.Shutdown(ctx)
	}()

	log.Fatal(server.ListenAndServe())
}
