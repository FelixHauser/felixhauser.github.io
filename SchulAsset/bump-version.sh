#!/bin/bash
# bump-version.sh — sets a new version suffix (?v=...) on every LOCAL script and
# stylesheet reference in the HTML pages, so browsers fetch fresh files after a deploy.
#
# Run it before every push that changes a .js or .css file:
#     ./bump-version.sh              # new version: today's date + counter, e.g. 20261113-2
#     ./bump-version.sh 20261201-1   # or set a version yourself
#
# CDN libraries (URLs starting with http) are never touched.

set -e
cd "$(dirname "$0")"

PAGES="login.html portal.html admin.html datenschutz.html impressum.html"

# Find the version currently in use (first ?v=... found in the pages).
CURRENT=$(grep -ho '?v=[0-9A-Za-z-]*' $PAGES | head -1 | sed 's/^?v=//')

if [ -n "$1" ]; then
  NEW="$1"
else
  TODAY=$(date +%Y%m%d)
  if [ "${CURRENT%%-*}" = "$TODAY" ]; then
    # Same day as the current version: increase the counter.
    NEW="$TODAY-$(( ${CURRENT##*-} + 1 ))"
  else
    NEW="$TODAY-1"
  fi
fi

for f in $PAGES; do
  # 1) Remove any old suffix from local references.
  # 2) Add the new one. Only src="..." / href="..." ending in .js or .css and
  #    not starting with http are matched.
  sed -E -i '' \
    -e 's#((src|href)="[^":]*\.(js|css))(\?v=[0-9A-Za-z-]*)?"#\1?v='"$NEW"'"#g' \
    "$f"
  echo "updated $f"
done

echo "Version: ${CURRENT:-none} -> $NEW"
