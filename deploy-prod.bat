@ECHO OFF
docker compose -p medmolnet-prod down
docker compose -f docker-compose.yaml --build up -d
PAUSE