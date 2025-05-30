@ECHO OFF
docker compose -p medmolnet-prod down
docker compose -p medmolnet-prod -f docker-compose.yaml up -d
PAUSE