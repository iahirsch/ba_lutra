#!/bin/bash

PROJECT_FOLDER="$HOME/Workspace/ba_lutra"
TOE_FILE="$HOME/Desktop/BA_Mapping_Werkschau.toe"

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

    tell application "Terminal"
        do script "ngrok http 3000"
        activate
    end tell

    -- Export activity stats, then run docker exec in a new Terminal window
    tell application "Terminal"
        -- Using quoted form of to let AppleScript safely handle the internal quotes
        do script "cd " & quoted form of projectFolder & " && ./scripts/export-activity-stats.sh " & quoted form of projectFolder & " && docker exec -it lutra-app zsh -c 'npx nx run-many --targets=serve --projects=backend,frontend; zsh'"
        activate
    end tell
end run
EOD

open -a "TouchDesigner" "$TOE_FILE"
