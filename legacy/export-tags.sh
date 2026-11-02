#!/bin/sh
# Exports the code of an old version's tags to legacy/.src/<version>/ with
# `git archive` (the exact tag contents, no checkout) and writes a .env file
# that points the compose build contexts at those folders.
#
#   legacy/export-tags.sh v1
#   docker compose --env-file legacy/.src/v1.env -f legacy/v1/compose.yaml up --build
set -eu

version=${1:?usage: legacy/export-tags.sh v1}
root=$(git rev-parse --show-toplevel)
out="$root/legacy/.src/$version"

case "$version" in
    v1) api_tag=api-v1-java; web_tag=web-v1-vite; prefix=V1 ;;
    *) echo "unknown version: $version" >&2; exit 1 ;;
esac

rm -rf "$out"
for pair in "api:$api_tag" "web:$web_tag"; do
    app=${pair%%:*}
    tag=${pair#*:}
    mkdir -p "$out/$app"
    git -C "$root" archive "$tag" "apps/$app" | tar -x -C "$out/$app" --strip-components=2
    echo "$tag -> legacy/.src/$version/$app"
done

cat > "$root/legacy/.src/$version.env" <<ENV
${prefix}_API_SRC=$out/api
${prefix}_WEB_SRC=$out/web
ENV
echo "Done: docker compose --env-file legacy/.src/$version.env -f legacy/$version/compose.yaml up --build"
