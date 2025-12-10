@echo off
echo Fixing duplicate node_modules and git issues...

REM Kill any git processes
taskkill /f /im git.exe /t 2>nul

REM Remove duplicate frontend folder
if exist "frontend" (
    echo Removing duplicate frontend folder...
    rmdir /s /q "frontend"
)

REM Remove corrupted git files
del /f /q "ersfikre*" 2>nul

REM Clean git config
git config --global core.pager ""

echo Cleanup completed!
echo Checking current structure...
dir /b

echo.
echo Now you can run git commands normally.
pause