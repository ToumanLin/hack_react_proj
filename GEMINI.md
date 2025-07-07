# GEMINI.md

This file provides guidance to Gemini CLI (gemini.google.com/code) when working with code in this repository.

## Project Overview

This is a React-based character editor for the game Barotrauma. It allows users to view and edit character sprites, including limbs, attachments, and clothing. The application loads character data from XML files and renders the character using React components. It is built as a desktop application using Electron.

## Commands

- **Installation:** `npm install`
- **Development:** `npm start`
- **Testing:** `npm test`
- **Building:** `npm build`

## Architecture

The application's architecture has been refactored to use a centralized state management approach with **Zustand**. This has significantly simplified the component structure and improved data flow throughout the application.

- **State Management:** All application state is managed in a central Zustand store located at `src/store/characterStore.js`. This includes character data (limbs, joints, etc.), UI state (selected items), and all data-loading and manipulation logic.

- **Main Component (`src/components/Editor.js`):** The `Editor.js` component has been streamlined. It is now primarily responsible for orchestrating the layout of the various UI panels and the main character display. It fetches all its data directly from the `characterStore`.

- **Core Components (`src/components/`):**
    - **`Limb.js`**: Renders an individual character limb and its associated overlays (clothing, attachments). It sources its data from the `characterStore`.
    - **`Panel.js`**: A new generic, reusable component that provides the basic structure for all draggable and collapsible UI panels.
    - **`GenericSpriteSheetViewer.js`**: A new generic, reusable component for displaying sprite sheets with highlighted regions. It has replaced the previous `SpriteSheetViewer.js` and `HeadSheetViewer.js`.
    - **UI Panels (`PropertiesPanel.js`, `GenderPanel.js`, `JointsPanel.js`, `HeadPanel.js`, `ClothingManager.js`, `ClothSheetViewer.js`):** All UI panels have been refactored to be more modular. They now use the generic `Panel` component for their structure and connect directly to the `characterStore` for data and actions, eliminating the need for prop drilling.

- **Styling:** The project is moving away from inline styles. All refactored panel components now have their styles defined in separate `.css` files (e.g., `Panel.css`, `GenderPanel.css`), improving maintainability and separation of concerns.

- **Utilities (`src/utils/`):** The utility modules for path conversion (`pathUtils.js`), texture handling (`textureUtils.js`), and XML parsing (`xmlUtils.js`) remain crucial for processing the game's data files.

### Data Flow

1.  The main `Editor` component initializes the data loading process by calling an action in the `characterStore`.
2.  The `characterStore` action (`loadCharacter`) is responsible for fetching and parsing all necessary XML files (`filelist.xml`, `Human.xml`, etc.) using the utility functions.
3.  Once the data is parsed, it is processed and used to update the state within the `characterStore`.
4.  React components, which are subscribed to the `characterStore`, automatically re-render with the new data.
5.  User interactions (e.g., selecting a different gender, choosing a piece of clothing) call actions directly on the `characterStore`, which updates the state and triggers a re-render of the affected components.

This new architecture is more scalable, easier to debug, and promotes better code organization and reusability.