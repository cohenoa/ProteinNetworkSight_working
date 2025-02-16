@ECHO OFF
docker compose -p medmolnet-beta down
docker compose -p medmolnet-beta -f docker-compose.beta.yaml up -d
PAUSE