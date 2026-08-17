import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

pkg['pnpm'] = {
    "onlyBuiltDependencies": [
      "@sentry/node-cpu-profiler",
      "better-sqlite3",
      "esbuild"
    ]
}

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
