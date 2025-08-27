@ECHO OFF
cd /d %~dp0
docker compose -p medmolnet-dev -f docker-compose.dev.yaml down --remove-orphans
IF ERRORLEVEL 1 GOTO :err
docker compose -p medmolnet-dev -f docker-compose.dev.yaml up -d --build
IF ERRORLEVEL 1 GOTO :err
ECHO Dev stack deployed successfully.
PAUSE
EXIT /B 0
:err
ECHO Dev deployment failed. Check logs with:
ECHO   docker logs -f medmolnet-dev-frontend-1
ECHO   docker logs -f medmolnet-dev-backend-1
ECHO   docker logs -f medmolnet-dev-nginx-1
PAUSE
EXIT /B 1
