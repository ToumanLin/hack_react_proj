## Barotrauma Wearable Editor

A react based Barotrauma Wearable Editor. (Currently is more like a viewer). Built with Electron, the application can run on windows pc.

Github: https://github.com/ToumanLin/hack_react_proj
Actually this repo is my summer class final proj, so maybe in the future i'll switch to another repo

### Features

- **Visual Character Display**: See a live-updating preview of your character as you make changes.
- **Gender, Head Attachment Changing**: Load and view sprites for the character's body, head, and attachments. You can switch genders.
- **Advanced Clothing Editor**:
  - Select any piece of clothing from the game's files.
  - View clothing sprite sheets directly in the application.
  - Enable [u]Edit Mode[/u] to visually select and modify individual clothing sprites.
  - **Sprite Editor Panel** allows you to change:
    - `sourceRect`: The position and dimensions of the sprite on the sheet.
    - `origin`: The visual center of the sprite.
    - `calcualted scale`: The size of the sprite. ** important:** the scale here is the calculated final value based on limb scale, texture scale, ragdoll scale, so it is not the pure value you entered into xml.
- **Interactive UI Panels**: All tools are housed in draggable and collapsible panels, allowing you to customize your workspace.
  - **Limb Panel**: change the position, rotation, and depth of limb
  - **Gender Panel**: switch gender and vars loaded from human.xml
  - **Head Panel**: change head, hair, beard, etc.
  - **Clothing Manager**: Search and select clothing items.
  - **Sheet Viewer**: View sprite sheets and access the editor.
  - **Joints Panel**: View and construct character joints.

### How to Use (For Users)

1.  **Download**: subscribe to this mod and unzip.
2.  **Prepare Assets**: This application reads data from the game's asset files. You will need to place the `assets` folder (containing `filelist.xml`, `Content/`, etc.) in the **same directory** as the executable file.

    Your folder structure should look like this:

```
    /Mod/
    |-- Barotrauma Character Editor-portable.exe
    |-- /assets/ <-- Treat it as %ModDir%
        |-- filelist.xml <-- Make sure filelist.xml is in this position
        |-- (You mod content)
```

3.  **Launch**: Run the `.exe` file.