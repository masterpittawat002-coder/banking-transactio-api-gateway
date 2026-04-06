#!/bin/bash
set -e

# รอให้ postgres พร้อมก่อน
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  echo "PostgreSQL is not ready yet. Retrying in 2 seconds..."
  sleep 2
done
echo "PostgreSQL is ready!"

# run migration เรียงตามชื่อไฟล์ (001, 002, 003, ...)
echo "Running migrations..."
for f in /migrations/*.sql; do
  echo "  Running $(basename $f) ..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f"
done

echo "All migrations completed!"

# ถ้า DB_SEED เป็น true จะ run seed
if [ "$DB_SEED" = "true" ]; then
  echo "Running seeds..."
  for f in /seeds/*.sql; do
    echo "  Seeding $(basename $f) ..."
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$f"
  done
  echo "All seeds completed!"
fi