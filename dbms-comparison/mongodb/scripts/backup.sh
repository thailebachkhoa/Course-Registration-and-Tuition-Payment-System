#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${MONGO_DB_NAME:-course_registration_mongo}"
CONTAINER_NAME="${MONGO_CONTAINER_NAME:-dbms-mongodb}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_PATH="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.archive.gz"

mkdir -p "${BACKUP_DIR}"

docker exec "${CONTAINER_NAME}" mongodump --db "${DB_NAME}" --archive --gzip > "${ARCHIVE_PATH}"
cp "${ARCHIVE_PATH}" "${BACKUP_DIR}/latest.archive.gz"

echo "Backup created at ${ARCHIVE_PATH}"
