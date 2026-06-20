#!/bin/bash

pkill -f "ngrok http" 2>/dev/null
docker stop lutra-app lutra-db >/dev/null 2>&1

killall Terminal 2>/dev/null
pkill -f "TouchDesigner" 2>/dev/null
pkill -f "Visual Studio Code" 2>/dev/null

osascript <<'EOD'
if application "Docker" is running then
    tell application "Docker" to quit
end if
EOD

sleep 8

pmset sleepnow
