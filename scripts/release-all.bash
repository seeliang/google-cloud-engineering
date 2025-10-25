#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

project=""
declare -a server_args=()
declare -a web_args=()

# Default project used when none is provided explicitly.
DEFAULT_PROJECT="cloud-engineer-certify"

show_help() {
    cat <<'EOF'
Usage: release-all.bash [options]

Options:
  --project <id>       Google Cloud project to deploy to (applies to both steps).
  --project=<id>       Same as above.
    --server <arg>       Extra argument passed to server/release-server.sh (repeatable).
    --web <arg>          Extra argument passed to web/release-web.sh (repeatable).
  --help               Show this help text.

The script deploys the Cloud Function first, then the App Engine app in web/app.yaml.
If no project is supplied, it defaults to cloud-engineer-certify.
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --project)
            [[ $# -ge 2 ]] || { echo "Error: --project requires a value" >&2; exit 1; }
            project="$2"
            shift 2
            ;;
        --project=*)
            project="${1#*=}"
            shift 1
            ;;
        --server)
            [[ $# -ge 2 ]] || { echo "Error: --server requires a value" >&2; exit 1; }
            server_args+=("$2")
            shift 2
            ;;
        --web)
            [[ $# -ge 2 ]] || { echo "Error: --web requires a value" >&2; exit 1; }
            web_args+=("$2")
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option $1" >&2
            show_help >&2
            exit 1
            ;;
    esac
done

if [[ -z "${project}" ]]; then
    project="${DEFAULT_PROJECT}"
fi

server_script="${REPO_ROOT}/server/release-server.sh"
web_script="${REPO_ROOT}/web/release-web.sh"

declare -a server_cmd=("bash" "${server_script}" "${project}")
if ((${#server_args[@]})); then
    server_cmd+=("${server_args[@]}")
fi

echo "Deploying Cloud Function..."

"${server_cmd[@]}"

declare -a web_cmd=("bash" "${web_script}" "${project}")
if ((${#web_args[@]})); then
    web_cmd+=("${web_args[@]}")
fi

echo "Deploying App Engine app..."

"${web_cmd[@]}"

echo "Release complete."
