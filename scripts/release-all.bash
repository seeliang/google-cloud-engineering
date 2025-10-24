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
  --server <arg>       Extra argument passed to server/deploy-server.bash (repeatable).
  --web <arg>          Extra argument passed to gcloud app deploy (repeatable).
  --help               Show this help text.

The script deploys the Cloud Function first, then the App Engine app configured by app.yaml.
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

declare -a server_cmd=("${REPO_ROOT}/server/deploy-server.bash")
if [[ -n "${project}" ]]; then
    server_cmd+=("--project=${project}")
fi
server_cmd+=("${server_args[@]}")

echo "Deploying Cloud Function..."
(
    cd "${REPO_ROOT}/server"
    "${server_cmd[@]}"
)

declare -a web_cmd=("gcloud" "app" "deploy" "${REPO_ROOT}/app.yaml")
if [[ -n "${project}" ]]; then
    web_cmd+=("--project=${project}")
fi
web_cmd+=("${web_args[@]}")

echo "Deploying App Engine app..."
"${web_cmd[@]}"

echo "Release complete."
