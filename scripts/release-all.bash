#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

project=""
declare -a cloud_function_args=()
declare -a app_engine_args=()

# Default project used when none is provided explicitly.
DEFAULT_PROJECT="cloud-engineer-certify"

show_help() {
    cat <<'EOF'
Usage: release-all.bash [options]

Options:
    --project <id>       Google Cloud project to deploy to (applies to both steps).
    --project=<id>       Same as above.
    --cloud-function <arg>  Extra argument passed to cloud-function/release-cloud-function.sh (repeatable).
    --app-engine <arg>      Extra argument passed to app-engine/release-app-engine.sh (repeatable).
    --help               Show this help text.

The script deploys the Cloud Function first, then the App Engine app in app-engine/app.yaml.
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
        --cloud-function)
            [[ $# -ge 2 ]] || { echo "Error: --cloud-function requires a value" >&2; exit 1; }
            cloud_function_args+=("$2")
            shift 2
            ;;
        --app-engine)
            [[ $# -ge 2 ]] || { echo "Error: --app-engine requires a value" >&2; exit 1; }
            app_engine_args+=("$2")
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

cloud_function_script="${REPO_ROOT}/cloud-function/release-cloud-function.sh"
app_engine_script="${REPO_ROOT}/app-engine/release-app-engine.sh"

declare -a cloud_function_cmd=("bash" "${cloud_function_script}" "${project}")
if ((${#cloud_function_args[@]})); then
    cloud_function_cmd+=("${cloud_function_args[@]}")
fi

echo "Deploying Cloud Function..."

"${cloud_function_cmd[@]}"

declare -a app_engine_cmd=("bash" "${app_engine_script}" "${project}")
if ((${#app_engine_args[@]})); then
    app_engine_cmd+=("${app_engine_args[@]}")
fi

echo "Deploying App Engine app..."

"${app_engine_cmd[@]}"

echo "Release complete."
