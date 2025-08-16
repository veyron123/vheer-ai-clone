@echo off
echo Killing processes on ports 5000 and 5178...

REM Kill process on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5000
    taskkill /PID %%a /F 2>nul
)

REM Kill process on port 5178  
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5178 ^| findstr LISTENING') do (
    echo Killing process %%a on port 5178
    taskkill /PID %%a /F 2>nul
)

echo Ports cleared!