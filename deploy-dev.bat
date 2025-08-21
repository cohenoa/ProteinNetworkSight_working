@ECHO OFF
docker compose -p medmolnet-dev down
IF "%1" == "--build" (
    docker compose -p medmolnet-dev -f docker-compose.dev.yaml --build up -d
) ELSE (
    docker compose -p medmolnet-dev -f docker-compose.dev.yaml up -d
)
PAUSE