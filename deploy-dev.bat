@ECHO OFF
docker compose -p medmolnet-dev down
IF "%1" == "--build" (
    docker compose -f docker-compose.dev.yaml up --build -d
) ELSE (
    docker compose -f docker-compose.dev.yaml up -d
)
PAUSE