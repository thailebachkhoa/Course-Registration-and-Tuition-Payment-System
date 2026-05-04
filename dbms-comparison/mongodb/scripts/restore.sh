#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${MONGO_DB_NAME:-course_registration_mongo}"
CONTAINER_NAME="${MONGO_CONTAINER_NAME:-dbms-mongodb}"
ARCHIVE_PATH="${1:-./backups/latest.archive.gz}"

if [[ ! -f "${ARCHIVE_PATH}" ]]; then
  echo "Archive not found: ${ARCHIVE_PATH}" >&2
  exit 1
fi

cat "${ARCHIVE_PATH}" | docker exec -i "${CONTAINER_NAME}" mongorestore --nsInclude "${DB_NAME}.*" --drop --archive --gzip

echo "Restore completed from ${ARCHIVE_PATH}"
