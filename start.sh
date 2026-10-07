#!/usr/bin/env bash
# Hangar 7 project launcher.
# Installs dependencies, builds the static bundle when needed, declares the
# deployment output, then serves it in the foreground on PORT (default 3000).
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
/usr/bin/time -p test -d "$PROJECT_DIR"
/usr/bin/time -p test -n "${RUNTIME_DIR:?RUNTIME_DIR must be set}"
/usr/bin/time -p test -n "${OPENCODE_WEB_DIR:?OPENCODE_WEB_DIR must be set}"
PORT="${PORT:-3000}"
export PORT
/usr/bin/time -p test -f "$PROJECT_DIR/package.json"
export PROJECT_DIR
/usr/bin/time -p mkdir -p "$OPENCODE_WEB_DIR"
/usr/bin/time -p mkdir -p "$PROJECT_DIR/dist"

NEED_INSTALL=1
if /usr/bin/time -p test -d "$PROJECT_DIR/node_modules/vite" && /usr/bin/time -p test -f "$PROJECT_DIR/node_modules/.package-lock.json"; then
  NEED_INSTALL=0
  if /usr/bin/time -p test -f "$PROJECT_DIR/package-lock.json"; then
    if /usr/bin/time -p test "$PROJECT_DIR/package-lock.json" -nt "$PROJECT_DIR/node_modules/.package-lock.json"; then NEED_INSTALL=1; fi
  fi
  if /usr/bin/time -p test "$PROJECT_DIR/package.json" -nt "$PROJECT_DIR/node_modules/.package-lock.json"; then NEED_INSTALL=1; fi
fi
if /usr/bin/time -p test "$NEED_INSTALL" = 1; then
  if /usr/bin/time -p test -f "$PROJECT_DIR/package-lock.json"; then
    /usr/bin/time -p npm ci --no-audit --no-fund --prefix "$PROJECT_DIR"
  else
    /usr/bin/time -p npm install --no-audit --no-fund --prefix "$PROJECT_DIR"
  fi
fi

NEED_BUILD=1
if /usr/bin/time -p test -f "$PROJECT_DIR/dist/index.html"; then
  if /usr/bin/time -p test -z "$(find "$PROJECT_DIR/src" "$PROJECT_DIR/index.html" "$PROJECT_DIR/package.json" "$PROJECT_DIR/vite.config.js" -newer "$PROJECT_DIR/dist/index.html" -print -quit 2>/dev/null)"; then NEED_BUILD=0; fi
fi
if /usr/bin/time -p test "$NEED_BUILD" = 1; then
  /usr/bin/time -p "$PROJECT_DIR/node_modules/.bin/vite" build --emptyOutDir
fi
/usr/bin/time -p test -f "$PROJECT_DIR/dist/index.html"

/usr/bin/time -p node -e 'const fs=require("node:fs"),path=require("node:path");const project=process.env.PROJECT_DIR;const directory=path.join(project,"dist");if(!fs.statSync(directory).isDirectory())throw new Error("missing dist");if(!fs.statSync(path.join(directory,"index.html")).isFile())throw new Error("missing index.html");const out={project,directory};fs.writeFileSync(path.join(process.env.OPENCODE_WEB_DIR,"deployment-output.json"),JSON.stringify(out));console.log("deployment-output: "+JSON.stringify(out));'

exec /usr/bin/time -p "$PROJECT_DIR/node_modules/.bin/vite" preview --host 0.0.0.0 --port "$PORT" --strictPort
