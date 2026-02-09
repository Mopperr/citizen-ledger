@echo off
REM ─────────────────────────────────────────────────────────────────────
REM  Wasm Optimizer – deterministic builds via cosmwasm/optimizer (Windows)
REM  Produces optimized .wasm binaries in artifacts/
REM  Requires Docker Desktop to be running.
REM ─────────────────────────────────────────────────────────────────────
setlocal

cd /d "%~dp0\.."
set ROOT=%cd%
set OPTIMIZER_VERSION=0.17.0
set IMAGE=cosmwasm/optimizer:%OPTIMIZER_VERSION%

echo ===================================================
echo   CosmWasm Optimizer - Deterministic Build
echo ===================================================
echo.
echo Using %IMAGE%
echo Workspace: %ROOT%
echo.

echo Pulling optimizer image...
docker pull %IMAGE%
if errorlevel 1 (
    echo ERROR: Failed to pull Docker image. Is Docker running?
    exit /b 1
)

echo.
echo Building optimized wasm binaries...
docker run --rm ^
    -v "%ROOT%:/code" ^
    --mount type=volume,source=citizen_ledger_cache,target=/target ^
    --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry ^
    %IMAGE%

if errorlevel 1 (
    echo ERROR: Optimizer build failed.
    exit /b 1
)

echo.
echo ===================================================
echo   Build Complete!
echo ===================================================
echo.
echo Optimized artifacts:
dir /b "%ROOT%\artifacts\*.wasm" 2>nul || echo   (no .wasm files found)
echo.

if exist "%ROOT%\artifacts\checksums.txt" (
    echo Checksums:
    type "%ROOT%\artifacts\checksums.txt"
)
