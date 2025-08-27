@ECHO OFF
cd /d %~dp0
docker compose -p medmolnet-prod -f docker-compose.prod.yaml down --remove-orphans
IF ERRORLEVEL 1 GOTO :err
docker compose -p medmolnet-prod -f docker-compose.prod.yaml up -d --build
IF ERRORLEVEL 1 GOTO :err
ECHO Prod stack deployed successfully.
PAUSE
EXIT /B 0
:err
ECHO Prod deployment failed. Check logs with:
ECHO   docker logs -f prod-nginx
ECHO   docker logs -f prod-back
ECHO   docker logs -f prod-front
PAUSE
EXIT /B 1
