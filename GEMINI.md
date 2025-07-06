# GEMINI.md

This file provides guidance to Gemini CLI (gemini.google.com/code) when working with code in this repository.

## Project Overview

This is a React-based character editor for the game Barotrauma. It allows users to view and edit character sprites, including limbs, attachments, and clothing. The application loads character data from XML files and renders the character using React components.

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
- The `utils` directory contains helper functions for:
    - `pathUtils.js`: Resolving file paths and loading character data.
    - `textureUtils.js`: Converting texture paths.
    - `xmlUtils.js`: Parsing XML data.
- The `public/assets` directory contains image assets from the game.

### File Loading and Parsing

The application loads character data from several XML files:

-   **`filelist.xml`**: This file contains a list of all content packages, including the main character file, `Human.xml`.
-   **`Human.xml`**: This file defines the character's structure, including ragdolls, head attachments, and head sprites.
-   **`HumanDefaultRagdoll.xml`**: This file defines the character's ragdoll, including limbs and joints.

The application uses the `xml2js` library to parse these XML files. The `src/utils/pathUtils.js` and `src/utils/xmlUtils.js` files contain utility functions for loading and parsing these files.

### Character Rendering

The character is rendered using a series of React components:

-   **`Editor.js`**: This is the main component that orchestrates the entire editor. It loads the character data, manages the character's state, and renders the other components.
-   **`Character.js`**: This component renders the character's limbs.
-   **`Limb.js`**: This component renders a single limb, including any attachments or clothing.
-   **`SpriteSheetViewer.js`** and **`HeadSheetViewer.js`**: These components display the character's sprite sheets, allowing the user to see all of the available sprites.

The character's position and rotation are calculated based on the data in the ragdoll XML file. The user can also edit the character's properties using the `PropertiesPanel.js` component.

### State Management

The application's state is managed using React's `useState` hook. The main `Editor.js` component manages the character's limbs, joints, and other properties. When the user makes a change to the character, the state is updated and the components are re-rendered.
