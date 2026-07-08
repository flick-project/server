#!/bin/sh
# entrypoint.sh

echo "Running database migrations..."
npm run migrate:up

echo "Starting application..."
exec node src/server.js