#!/bin/bash

# Build script for termsnap
# This script builds Go binaries for all supported platforms

set -e

echo "Building Go binaries for all platforms..."

# Create binaries directory
mkdir -p binaries

# Build for macOS (Intel)
echo "Building for macOS (Intel)..."
GOOS=darwin GOARCH=amd64 go build -o binaries/termsnap-darwin-x64 main.go

# Build for macOS (Apple Silicon)
echo "Building for macOS (Apple Silicon)..."
GOOS=darwin GOARCH=arm64 go build -o binaries/termsnap-darwin-arm64 main.go

# Build for Linux (Intel)
echo "Building for Linux (Intel)..."
GOOS=linux GOARCH=amd64 go build -o binaries/termsnap-linux-x64 main.go

# Build for Linux (ARM)
echo "Building for Linux (ARM)..."
GOOS=linux GOARCH=arm64 go build -o binaries/termsnap-linux-arm64 main.go

# Build for Windows (Intel)
echo "Building for Windows (Intel)..."
GOOS=windows GOARCH=amd64 go build -o binaries/termsnap-win32-x64.exe main.go

echo "Build completed successfully!"
echo "Binary files created:"
ls -la binaries/ 
