@ECHO OFF
docker compose -p medmolnet-prod down
IF "%1" == "--build" (
    docker compose -p medmolnet-prod -f docker-compose.yaml --build up -d
) ELSE (
    docker compose -p medmolnet-prod -f docker-compose.yaml up -d
)
PAUSE