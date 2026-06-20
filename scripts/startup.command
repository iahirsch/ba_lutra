#!/bin/bash

# 1. Define your paths
PROJECT_FOLDER="$HOME/Workspace/ba_praktisch"
TOE_FILE="$HOME/Desktop/BA_Mapping_Werkschau.toe"

# 2. Run AppleScript with single quotes around the heredoc (<<'EOD') 
# to prevent bash from messing with the internal strings, and pass variables via arguments.
osascript - "$PROJECT_FOLDER" <<'EOD'
on run argv
    set projectFolder to item 1 of argv

    -- Open Docker
    tell application "Docker" to activate

    delay 6

    -- Open VS Code with the project folder
    tell application "Visual Studio Code"
        open posix file projectFolder
        activate
    end tell

    delay 10

    -- Trigger Dev Containers command
    tell application "System Events"
        tell process "Code"
            set frontmost to true
            delay 1
            keystroke "p" using {command down, shift down}
            delay 1
            keystroke "Dev Containers: Reopen in Container"
            delay 1
            key code 36 -- Return key
        end tell
    end tell

    delay 12

    -- Wrapped in try so a rollover failure never blocks the app from starting.
    try
        do shell script "/bin/bash " & quoted form of (projectFolder & "/scripts/exhibition-db-rollover.sh") & " " & quoted form of projectFolder
    on error errMsg
        log "exhibition-db-rollover.sh failed: " & errMsg
    end try

    tell application "Terminal"
        do script "ngrok http 3000"
        activate
    end tell

    -- Run docker exec in a new Terminal window
    tell application "Terminal"
        -- Using quoted form of to let AppleScript safely handle the internal quotes
        do script "docker exec -it lutra-app zsh -c 'npx nx run-many --targets=serve --projects=backend,frontend; zsh'"
        activate
    end tell
end run
EOD

open -a "TouchDesigner" "$TOE_FILE"
