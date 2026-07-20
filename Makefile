.PHONY: all setup dev down clean

setup:
	@echo "Setting up Node.js workspaces..."
	pnpm install
	@echo "Setting up Python MCP server..."
	cd packages/mcp-server && python3 -m venv .venv && ./.venv/bin/pip install -r requirements.txt fastmcp

dev:
	@echo "Starting Sonagi Draw locally using Docker Compose..."
	docker-compose up -d

down:
	@echo "Stopping Docker containers..."
	docker-compose down

clean:
	@echo "Cleaning node_modules and python caches..."
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "__pycache__" -type d -prune -exec rm -rf '{}' +
	find . -name ".venv" -type d -prune -exec rm -rf '{}' +
