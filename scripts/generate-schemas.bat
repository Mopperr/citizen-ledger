@echo off
REM Generate JSON schemas for all contracts (Windows)
setlocal enabledelayedexpansion

cd /d "%~dp0\.."

set CONTRACTS=credential-registry treasury voting grants staking-emissions

echo ===================================================
echo   Generating JSON Schemas for All Contracts
echo ===================================================

for %%c in (%CONTRACTS%) do (
    echo.
    echo -- %%c --
    cargo run --bin schema --manifest-path "contracts\%%c\Cargo.toml"
    if errorlevel 1 (
        echo ERROR: Failed to generate schema for %%c
        exit /b 1
    )
    echo    Schema written to contracts\%%c\schema\
)

echo.
echo All schemas generated successfully!
echo    Output: contracts\*\schema\*.json
