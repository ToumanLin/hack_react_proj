# GEMINI.md

This file provides guidance to Gemini CLI (gemini.google.com/code) when working with code in this repository.

## Commands

- **Installation:** `npm install`
- **Development:** `npm start`
- **Testing:** `npm test`
- **Building:** `npm build`

## Architecture

This is a React-based character editor for the game Barotrauma.

- The main application logic is in `src/App.js`.
- Core components are located in `src/components/`:
    - `Editor.js`: The main editor interface.
    - `Character.js`: Represents the character being edited.
    - `PropertiesPanel.js`: UI for editing character properties.
    - `GenderPanel.js`, `JointsPanel.js`, `Limb.js`: Components for specific character features.
    - `HeadSheetViewer.js`: Displays a sheet of character heads.
    - `SpriteSheetViewer.js`: Displays a sprite sheet for the character.
- The `Reference` directory contains the source code for Barotrauma, which can be used for reference.
- The `public/assets` directory contains image assets from the game.
