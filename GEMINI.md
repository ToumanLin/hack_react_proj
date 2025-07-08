# GEMINI.md

This file provides guidance to Gemini CLI (gemini.google.com/code) when working with code in this repository.

## Project Overview

This is a React-based character editor for the game Barotrauma. It allows users to view and edit character sprites, including limbs, attachments, and clothing. The application loads character data from XML files and renders the character using React components. It is built as a desktop application using Electron.

## Commands

- **Installation:** `npm install`
- **Development:** `npm start`
- **Testing:** `npm test`
- **Building:** `npm build`
- **Linting:** `npm run lint`

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

---

## File-by-File Analysis and Improvement Suggestions

### `package.json`

*   **Summary:** This file defines the project's metadata, dependencies, and scripts. It's a standard setup for a React application built with Create React App and customized with `react-app-rewired` to integrate Electron. It includes dependencies for UI (`react`, `react-draggable`), XML parsing (`xml2js`, `xmldom`), and state management (`zustand`). The scripts cover development, building, and packaging the Electron application.
*   **Improvement Suggestions:**
    1.  **Dependency Audit:** Some dependencies are either very new (`@testing-library/react@16`) or could be updated. It would be beneficial to run `npm audit` and review dependency versions to ensure compatibility and security.

### `src/App.js`

*   **Summary:** This is the root component of the React application. Its sole responsibility is to render the main `Editor` component. It also imports the global `App.css` stylesheet.
*   **Improvement Suggestions:**
    *   This component is simple and serves its purpose well. No changes are currently needed.

### `src/store/characterStore.js`

*   **Summary:** This file is the heart of the application's state management, implemented using Zustand. It centralizes all character-related data, including limbs, joints, attachments, and clothing, as well as UI state like the current gender and selected items. Crucially, it contains the asynchronous `loadCharacter` action, which encapsulates the entire complex data-loading pipeline—from fetching XML files to parsing them and calculating the initial character pose. Actions like `setGender` are designed to automatically trigger this data-reloading process.
*   **Improvement Suggestions:**
    1.  **Refactor `loadCharacter` Action:** The `loadCharacter` function is very large and handles multiple distinct parsing steps. It should be broken down into smaller, more specialized helper functions (e.g., `parseLimbs`, `parseHeadAttachments`, `calculateInitialPose`). This would make the code more readable, testable, and easier to maintain.
    2.  **Improve Error Handling:** The current error handling only logs issues to the console. A more robust solution would be to add an `error` state to the store. When a data-loading error occurs, this state would be updated, allowing UI components to subscribe to it and display a user-friendly error message (e.g., using a toast notification).

### `src/components/Editor.js`

*   **Summary:** After the refactoring, `Editor.js` serves as the main layout container for the application. It fetches all its data and logic from the central `characterStore`. Its primary responsibilities are now to arrange the various UI panels and viewers on the screen and to pass the necessary data (like prepared sprite lists) to the `GenericSpriteSheetViewer` components. The component's own logic has been significantly reduced, with most of it moved into the Zustand store.
*   **Improvement Suggestions:**
    1.  **Simplify Event Handlers:** Handlers like `handleUpdateLimb` are now simple wrappers around actions from the store. These could potentially be simplified or called more directly from the child components where the events originate.

### `src/components/Limb.js`

*   **Summary:** This is a critical and complex component responsible for rendering a single draggable limb. It sources most of its data from the `characterStore` and handles the intricate logic for overlaying clothing and head attachments. This includes calculating z-index, applying transformations (scale, rotation), and managing texture processing for Electron environments.
*   **Improvement Suggestions:**
    1.  **Component Extraction:** The `renderOverlay` function is a prime candidate for extraction into its own `Overlay.js` component. This would significantly simplify the `Limb` component and isolate the complex overlay rendering logic.
    2.  **Performance:** The `useEffect` hooks for processing textures could be optimized. Instead of processing all textures every time `clothingSprites` or `limb` changes, a more sophisticated caching or memoization strategy could be employed to prevent unnecessary re-renders.
    3.  **Direct State Updates:** The `onUpdate` and `onSelect` props are passed down from `Editor.js`. To further decouple the components, `Limb.js` could directly call the relevant actions (`setSelectedLimb`, `setLimbs`) from the `characterStore`.

### `src/components/Panel.js`

*   **Summary:** This is a generic, reusable presentational component created during the refactoring process. It provides the standard UI for a draggable and collapsible panel, with a consistent header style and toggle button. It uses `react-draggable` for its drag-and-drop functionality and accepts a `title` and `children` as props, allowing it to wrap any content.
*   **Improvement Suggestions:**
    *   This component is clean, reusable, and serves its purpose well. No further changes are needed at this time.

### `src/components/GenericSpriteSheetViewer.js`

*   **Summary:** This reusable component was created to replace the duplicated logic in the old `SpriteSheetViewer` and `HeadSheetViewer`. It is responsible for displaying a texture (sprite sheet) and rendering highlighted rectangles for each sprite. It is draggable and collapsible, and it can optionally display a dropdown menu to switch between different textures.
*   **Improvement Suggestions:**
    1.  **Custom Hook for Texture Processing:** The `useEffect` hook that processes the texture path into a blob URL could be extracted into a custom hook (e.g., `useProcessedTexture(texture)`) to make the component's logic cleaner and more focused on rendering.

### `src/components/ClothingManager.js`

*   **Summary:** This component manages the selection of clothing items. It is responsible for discovering all wearable items by parsing the `filelist.xml` and then parsing the individual item XML files. It presents the user with a searchable dropdown list of available clothing and handles the logic for loading the selected clothing's sprites into the central store.
*   **Improvement Suggestions:**
    1.  **Extract Data Logic:** The extensive logic for finding, fetching, and parsing clothing items is currently co-located with the UI code. This should be extracted into a dedicated custom hook (e.g., `useClothingItems()`) or moved into the `characterStore` to separate concerns.
    2.  **Centralize State:** The component's local state (e.g., `isLoading`, `availableItems`, `searchTerm`, `selectedItem`) should be moved into the `characterStore` to provide a single source of truth for all application data.

### `src/components/ClothSheetViewer.js`

*   **Summary:** This component is responsible for displaying the sprite sheets for the currently selected clothing item. It takes the `clothingSprites` from the central store, groups them by their texture path, and then calculates the correct `sourceRect` for each sprite, handling cases where the rectangle is inherited from a character's limb. It is built using the generic `Panel` component.
*   **Improvement Suggestions:**
    1.  **Extract Data Logic:** The logic for grouping sprites and calculating their source rectangles is complex and currently resides within a `useEffect` hook. This logic should be extracted into a custom hook (e.g., `useTextureGroups(clothingSprites, limbs)`) to make the component cleaner and more focused on rendering.
    2.  **Merge with Generic Viewer:** This component shares a lot of functionality with the `GenericSpriteSheetViewer`. In a future refactoring, it might be possible to merge them into a single, more powerful sprite sheet viewer that can handle different data structures.

### `src/utils/pathUtils.js`

*   **Summary:** This utility module is central to the data loading process. It contains a collection of functions responsible for resolving game-specific file paths, loading various XML files (`filelist.xml`, `Human.xml`, etc.), and processing texture paths for different character parts. It correctly handles path transformations for both development and Electron production environments.
*   **Improvement Suggestions:**
    *   This module has been refactored to remove code duplication in file reading logic. No further changes are needed at this time.

### `src/utils/textureUtils.js`

*   **Summary:** This module provides essential functions for handling texture paths. It includes logic to convert game-specific paths (e.g., with `[GENDER]` placeholders or `%ModDir%` prefixes) into web-compatible URLs. It also contains the `convertTexturePathToBlobUrl` function, which is critical for loading local texture files in the Electron production environment.
*   **Improvement Suggestions:**
    *   This module has been refactored to remove code duplication. No further changes are needed at this time.

### `src/utils/xmlUtils.js`

*   **Summary:** This module provides a robust set of utility functions for parsing XML data. Its key feature is the ability to handle inconsistent attribute name casing (e.g., `SourceRect` vs. `sourcerect`) by checking multiple variations. It also includes type-safe parsers for common data types and helper functions to parse entire attribute sets from different XML elements.
*   **Improvement Suggestions:**
    *   This module has been refactored to remove code duplication. No further changes are needed at this time.

### `src/utils/envUtils.js`

*   **Summary:** This is a small but crucial utility module that provides helper functions to detect the current runtime environment. It can determine if the application is running in Electron, in a production build (`file://` protocol), or in a standard development environment.
*   **Improvement Suggestions:**
    *   This module is focused and effective. No changes are needed.

### `src/utils/xmlUtilsExample.js`

*   **Summary:** This file serves as a set of examples demonstrating how to use the functions in `xmlUtils.js`. It is not part of the application's production code.
*   **Improvement Suggestions:**
    *   As this is an example file, no functional improvements are necessary. However, it could be expanded to include examples for every function exported from `xmlUtils.js` to serve as more comprehensive documentation.
