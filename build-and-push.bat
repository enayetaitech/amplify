@echo off
REM Build and Push Docker Images to Docker Hub (Windows)
REM Usage: build-and-push.bat [tag]
REM If no tag is provided, it will use 'latest'

setlocal enabledelayedexpansion

REM Configuration - Change these values
set DOCKER_USERNAME=enayetsyl
set BACKEND_IMAGE=%DOCKER_USERNAME%/amplify-backend
set FRONTEND_IMAGE=%DOCKER_USERNAME%/amplify-frontend
set TAG=%1
if "%TAG%"=="" set TAG=latest

echo 🚀 Starting Docker build and push process...
echo 📦 Backend Image: %BACKEND_IMAGE%:%TAG%
echo 🌐 Frontend Image: %FRONTEND_IMAGE%:%TAG%
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check Docker Hub authentication
docker info 2>nul | findstr /C:"Username" >nul
if errorlevel 1 (
    echo 🔐 Please login to Docker Hub:
    docker login
    if errorlevel 1 (
        echo ❌ Docker Hub login failed.
        pause
        exit /b 1
    )
)

echo.
echo 🏗️  Building Backend Image...
docker build ^
  -t %BACKEND_IMAGE%:%TAG% ^
  -f docker/dockerfile.backend ^
  .
if errorlevel 1 (
    echo ❌ Backend build failed.
    pause
    exit /b 1
)
echo ✅ Backend build completed!

echo.
echo 🏗️  Building Frontend Image...
docker build ^
  -t %FRONTEND_IMAGE%:%TAG% ^
  -f docker/dockerfile.frontend ^
  .
if errorlevel 1 (
    echo ❌ Frontend build failed.
    pause
    exit /b 1
)
echo ✅ Frontend build completed!

echo.
echo 📤 Pushing Images to Docker Hub...

echo 📤 Pushing Backend Image...
docker push %BACKEND_IMAGE%:%TAG%
if errorlevel 1 (
    echo ❌ Backend push failed.
    pause
    exit /b 1
)
echo ✅ Backend push completed!

echo 📤 Pushing Frontend Image...
docker push %FRONTEND_IMAGE%:%TAG%
if errorlevel 1 (
    echo ❌ Frontend push failed.
    pause
    exit /b 1
)
echo ✅ Frontend push completed!

echo.
echo 🎉 All images built and pushed successfully!
echo.
echo 📋 Summary:
echo    Backend:  %BACKEND_IMAGE%:%TAG%
echo    Frontend: %FRONTEND_IMAGE%:%TAG%
echo.
echo 💡 Usage in production:
echo    docker run -d -p 8978:8978 --env-file backend/.env.prod %BACKEND_IMAGE%:%TAG%
echo    docker run -d -p 80:8979 --env-file frontend/.env.prod %FRONTEND_IMAGE%:%TAG%

pause
