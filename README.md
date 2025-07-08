# Barotrauma Character Editor

A powerful, React-based visual editor for creating and modifying character sprites for the game Barotrauma. Built with Electron, this application provides a desktop experience for editing character XML data through an intuitive graphical interface.

## Features

- **Visual Character Display**: See a live-updating preview of your character as you make changes.
- **Comprehensive Sprite Editing**: Load and view sprites for the character's body, head, and attachments.
- **Advanced Clothing Editor**:
  - Select any piece of clothing from the game's files.
  - View clothing sprite sheets directly in the application.
  - Enable **Edit Mode** to visually select and modify individual clothing sprites.
  - A dedicated **Sprite Editor Panel** allows you to fine-tune:
    - `sourceRect`: The position and dimensions of the sprite on the sheet.
    - `origin`: The rotational center of the sprite.
    - `scale`: The size of the sprite.
  - **Intelligent Inheritance**: The editor smartly handles inherited properties. You can view values inherited from a limb and, with a single click, apply them to your sprite.
- **Interactive UI Panels**: All tools are housed in draggable and collapsible panels, allowing you to customize your workspace.
  - **Clothing Manager**: Search and select clothing items.
  - **Cloth Sheet Viewer**: View sprite sheets and access the editor.
  - **Joints Panel**: View and construct character joints.
  - And more for gender, head parts, and properties.

## How to Use (For Users)

1.  **Download**: Get the latest version from the project's releases page.
2.  **Prepare Assets**: This application reads data from the game's asset files. You will need to place the `assets` folder (containing `filelist.xml`, `Content/`, etc.) in the **same directory** as the executable file.

    Your folder structure should look like this:
    ```
    /Barotrauma-Editor/
    |-- Barotrauma Character Editor-portable.exe
    |-- /assets/
        |-- filelist.xml
        |-- /Content/
            |-- ... (and all other game asset files)
    ```

3.  **Launch**: Run the `.exe` file.
4.  **Editing Sprites**:
    - Use the **Clothing Manager** panel to load a piece of clothing.
    - In the **Clothing Sprites** panel, click the "Edit" button in the header to enable edit mode.
    - Click on any sprite overlay on the sprite sheet.
    - The **Edit Sprite** panel will appear, allowing you to change its properties.
    - Click "Save" to apply your changes or "Reset" to revert to the original values from the XML file.

## How to Use (For Developers)

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

- **Development Mode**: This will start the React development server and launch the Electron app.
  ```bash
  npm start
  ```

- **Build an Unpacked Version**: To test the production-like environment where the app reads from an `assets` folder, use the `quick-test` script. This will create an output folder in the `dist` directory.
  ```bash
  npm run quick-test
  ```

## Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Desktop Environment**: [Electron](https://www.electronjs.org/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI**: Custom components, with [react-draggable](https://github.com/react-grid-layout/react-draggable) for panel movement.