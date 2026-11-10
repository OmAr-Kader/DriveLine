#!/usr/bin/env bash
set -u

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="$PROJECT_DIR/DriveLine.xcodeproj"
SCHEME="APIConsole"
DESTINATION="platform=macOS"
CONFIGURATION="${CONFIGURATION:-Test}"

XCODEBUILD_ARGS=(
    -project "$PROJECT"
    -scheme "$SCHEME"
    -destination "$DESTINATION"
    -configuration "$CONFIGURATION"
    'LD_RUNPATH_SEARCH_PATHS=$(inherited) @executable_path'
    'SWIFT_ACTIVE_COMPILATION_CONDITIONS=Test'
)

LOG_FILE="$(mktemp "${TMPDIR:-/tmp}/api-console-build.XXXXXX")"
trap 'rm -f "$LOG_FILE"' EXIT

if [[ ! -d "$PROJECT" ]]; then
    printf 'Error: Xcode project not found: %s\n' "$PROJECT" >&2
    printf 'Place this script beside DriveLine.xcodeproj.\n' >&2
    exit 2
fi

printf 'Building %s (%s)...\n' "$SCHEME" "$CONFIGURATION"

if xcodebuild "${XCODEBUILD_ARGS[@]}" build >"$LOG_FILE" 2>&1; then
    printf 'Build succeeded.\n'
else
    BUILD_STATUS=$?
    printf '\nBuild failed (exit %s). Last 60 lines of build output:\n\n' "$BUILD_STATUS" >&2
    tail -n 60 "$LOG_FILE" >&2
    exit "$BUILD_STATUS"
fi

# Resolve the real product location from Xcode instead of hardcoding it.
SETTINGS="$(xcodebuild "${XCODEBUILD_ARGS[@]}" -showBuildSettings 2>/dev/null)"
BUILT_PRODUCTS_DIR="$(awk -F' = ' '$1 ~ /^ *BUILT_PRODUCTS_DIR$/ {print $2; exit}' <<<"$SETTINGS")"
EXECUTABLE_PATH="$(awk -F' = ' '$1 ~ /^ *EXECUTABLE_PATH$/ {print $2; exit}' <<<"$SETTINGS")"
EXECUTABLE="$BUILT_PRODUCTS_DIR/$EXECUTABLE_PATH"

if [[ -z "$BUILT_PRODUCTS_DIR" || -z "$EXECUTABLE_PATH" || ! -x "$EXECUTABLE" ]]; then
    printf 'Error: Build succeeded, but executable was not found or is not executable:\n%s\n' "$EXECUTABLE" >&2
    printf '\nLast 60 lines of build output:\n\n' >&2
    tail -n 60 "$LOG_FILE" >&2
    exit 1
fi

printf '\nRunning APIConsole...\n\n'
"$EXECUTABLE"