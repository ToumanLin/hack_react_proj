import xml2js from 'xml2js';
import { convertTexturePathWithFallback } from './textureUtils';
import { isElectronProduction } from './envUtils';

/**
 * Utility functions for parsing and resolving file paths in the Barotrauma character system
 */

// Helper: Remove %ModDir%/ or %moddir%/ prefix (case-insensitive)
const removeModDirPrefix = (path) => {
  if (!path) return path;
  return path.replace(/^%moddir(?::\d+)?%\//i, '');
};

/**
 * Converts a game path to a web-compatible path
 * @param {string} path - The original game path
 * @returns {string} - The converted web path
 */
export const convertGamePathToWebPath = (path) => {
  if (!path) return '';
  
  let convertedPath = path;
  
  // Handle %ModDir%/ prefix (case-insensitive) - convert to proper web path
  convertedPath = removeModDirPrefix(convertedPath);
  
  // Check if we're in Electron production environment
  const isElectron = window && window.electronAPI;
  const isProduction = window.location.protocol === 'file:' || window.location.href.includes('file://');
  
  // Convert to web path
  if (convertedPath.startsWith('Content/')) {
    if (isElectronProduction()) {
      convertedPath = convertedPath.replace('Content/', 'assets://Content/');
    } else {
      convertedPath = `/assets/${convertedPath}`;
    }
  }
  
  return convertedPath;
};

/**
 * Finds the Human.xml file entry in filelist.xml
 * @param {Object} filelistResult - Parsed filelist.xml content
 * @returns {Object|null} - The Human.xml file entry or null if not found
 */
export const findHumanXmlEntry = (filelistResult) => {
  const characterFiles = filelistResult.contentpackage.Character || [];
  
  const humanFileEntry = Array.isArray(characterFiles) 
    ? characterFiles.find(file => file.$.file && file.$.file.includes('Human.xml'))
    : characterFiles.$.file && characterFiles.$.file.includes('Human.xml') ? characterFiles : null;
  
  return humanFileEntry;
};

/**
 * Resolves the ragdolls folder path from Human.xml
 * @param {Object} character - Parsed character data from Human.xml
 * @param {string} humanXmlPath - The path to Human.xml
 * @returns {string} - The resolved ragdolls folder path
 */
export const resolveRagdollsFolderPath = (character, humanXmlPath) => {
  const ragdollsElement = character.ragdolls;
  if (!ragdollsElement || !ragdollsElement.$.folder) {
    throw new Error('Ragdolls folder not found in Human.xml');
  }
  
  let ragdollsFolder = ragdollsElement.$.folder;
  
  // Handle relative path "default" - it means same directory as Human.xml
  if (ragdollsFolder === 'default') {
    // Extract the directory path from Human.xml path
    const humanXmlDir = humanXmlPath.substring(0, humanXmlPath.lastIndexOf('/'));
    ragdollsFolder = `${humanXmlDir}/Ragdolls`;
  } else {
    // Handle %ModDir%/ prefix for ragdolls folder (case-insensitive)
    ragdollsFolder = removeModDirPrefix(ragdollsFolder);
    
    // Check if we're in Electron production environment
    
    
    // Convert the ragdolls folder path
    if (ragdollsFolder.startsWith('Content/')) {
      if (isElectronProduction()) {
        ragdollsFolder = ragdollsFolder.replace('Content/', 'assets://Content/');
      } else {
        ragdollsFolder = `/assets/${ragdollsFolder}`;
      }
    }
  }
  
  return ragdollsFolder;
};

/**
 * Loads and parses filelist.xml to find Human.xml path
 * @returns {Promise<Object>} - Object containing humanXmlPath and filelistResult
 */
export const loadFilelistAndFindHumanXml = async () => {
  // Check if we're in Electron production environment
  
  
  let filelistXmlText;
  
  if (isElectronProduction()) {
    // Use Electron API to read file
    if (window.electronAPI && window.electronAPI.readFile) {
      filelistXmlText = await window.electronAPI.readFile('filelist.xml');
    } else {
      throw new Error('Electron API not available');
    }
  } else {
    // Use fetch for development
    const filelistResponse = await fetch('/assets/filelist.xml');
    if (!filelistResponse.ok) {
      throw new Error(`Failed to load filelist.xml: ${filelistResponse.status} ${filelistResponse.statusText}`);
    }
    filelistXmlText = await filelistResponse.text();
  }
  
  const filelistParser = new xml2js.Parser({ explicitArray: false });
  const filelistResult = await filelistParser.parseStringPromise(filelistXmlText);
  
  const humanFileEntry = findHumanXmlEntry(filelistResult);
  if (!humanFileEntry) {
    throw new Error('Human.xml not found in filelist.xml');
  }
  
  // Extract the Human.xml path and convert it
  let humanXmlPath = humanFileEntry.$.file;
  humanXmlPath = convertGamePathToWebPath(humanXmlPath);
  
  return { humanXmlPath, filelistResult };
};

/**
 * Loads and parses Human.xml to get character data and ragdolls folder
 * @param {string} humanXmlPath - The path to Human.xml
 * @returns {Promise<Object>} - Object containing character data and ragdolls folder path
 */
export const loadHumanXmlAndGetRagdollsPath = async (humanXmlPath) => {
  // Check if we're in Electron production environment
  
  
  let characterXmlText;
  
  if (isElectronProduction()) {
    // Extract the relative path from the full path
    const relativePath = humanXmlPath.replace('assets://', '');
    if (window.electronAPI && window.electronAPI.readFile) {
      characterXmlText = await window.electronAPI.readFile(relativePath);
    } else {
      throw new Error('Electron API not available');
    }
  } else {
    // Use fetch for development
    const characterResponse = await fetch(humanXmlPath);
    if (!characterResponse.ok) {
      throw new Error(`Failed to load Human.xml: ${characterResponse.status} ${characterResponse.statusText}`);
    }
    characterXmlText = await characterResponse.text();
  }
  
  const characterParser = new xml2js.Parser({ explicitArray: false });
  const characterResult = await characterParser.parseStringPromise(characterXmlText);
  
  // Handle both direct Character and Override.Character structures
  const character = characterResult.Character || characterResult.Override?.Character;
  
  if (!character) {
    throw new Error('Character data not found in Human.xml');
  }
  
  const ragdollsFolder = resolveRagdollsFolderPath(character, humanXmlPath);
  
  return { character, ragdollsFolder };
};

/**
 * Loads and parses the ragdoll XML file
 * @param {string} ragdollsFolder - The ragdolls folder path
 * @returns {Promise<Object>} - Parsed ragdoll data
 */
export const loadRagdollXml = async (ragdollsFolder) => {
  // Check if we're in Electron production environment
  
  
  const ragdollPath = `${ragdollsFolder}/HumanDefaultRagdoll.xml`;
  let ragdollXmlText;
  
  if (isElectronProduction()) {
    // Extract the relative path from the full path
    const relativePath = ragdollPath.replace('assets://', '');
    if (window.electronAPI && window.electronAPI.readFile) {
      ragdollXmlText = await window.electronAPI.readFile(relativePath);
    } else {
      throw new Error('Electron API not available');
    }
  } else {
    // Use fetch for development
    const ragdollResponse = await fetch(ragdollPath);
    if (!ragdollResponse.ok) {
      throw new Error(`Failed to load HumanDefaultRagdoll.xml: ${ragdollResponse.status} ${ragdollResponse.statusText}`);
    }
    ragdollXmlText = await ragdollResponse.text();
  }
  
  const ragdollParser = new xml2js.Parser({ explicitArray: false });
  const ragdollResult = await ragdollParser.parseStringPromise(ragdollXmlText);
  
  return ragdollResult.Ragdoll;
};

/**
 * Processes texture paths in ragdoll data
 * @param {Object} ragdoll - Parsed ragdoll data
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {string} - The main texture path
 */
export const processRagdollTexturePath = (ragdoll, gender) => {
  let mainTexturePath = ragdoll.$.Texture || ragdoll.$.texture;
  if (mainTexturePath) {
    mainTexturePath = removeModDirPrefix(mainTexturePath);
  }
  return convertTexturePathWithFallback(mainTexturePath, gender);
};

/**
 * Processes texture paths for individual limbs
 * @param {string} texturePath - The texture path from the limb
 * @param {string} fallbackTexture - Fallback texture path from ragdoll
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {string} - The processed texture path
 */
export const processLimbTexturePath = (texturePath, fallbackTexture, gender) => {
  let finalTexturePath = texturePath;
  if (!finalTexturePath) {
    finalTexturePath = fallbackTexture;
  }
  
  // Handle %ModDir%/ prefix for texture paths (case-insensitive)
  if (finalTexturePath) {
    finalTexturePath = removeModDirPrefix(finalTexturePath);
  }
  
  return convertTexturePathWithFallback(finalTexturePath, gender);
};

/**
 * Main function to load all required XML files and resolve paths
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {Promise<Object>} - Object containing all loaded data
 */
export const loadCharacterData = async (gender) => {
  try {
    // Step 1: Load filelist.xml and find Human.xml path
    const { humanXmlPath } = await loadFilelistAndFindHumanXml();
    
    // Step 2: Load Human.xml and get ragdolls folder path
    const { character, ragdollsFolder } = await loadHumanXmlAndGetRagdollsPath(humanXmlPath);
    
    // Step 3: Load ragdoll XML
    const ragdoll = await loadRagdollXml(ragdollsFolder);
    
    // Step 4: Process main texture path
    const mainTexture = processRagdollTexturePath(ragdoll, gender);
    
    return {
      character,
      ragdoll,
      mainTexture,
      ragdollsFolder
    };
  } catch (error) {
    console.error('Error loading character data:', error);
    throw error;
  }
};

/**
 * Fallback function to load data using hardcoded paths
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {Promise<Object>} - Object containing all loaded data
 */
export const loadCharacterDataFallback = async (gender) => {
  try {
    // Check if we're in Electron production environment
    
    
    let ragdollXmlText, characterXmlText;
    
    if (isElectronProduction()) {
      // Use Electron API to read files
      if (window.electronAPI && window.electronAPI.readFile) {
        ragdollXmlText = await window.electronAPI.readFile('Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml');
        characterXmlText = await window.electronAPI.readFile('Content/Characters/Human/Human.xml');
      } else {
        throw new Error('Electron API not available');
      }
    } else {
      // Use fetch for development
      const ragdollResponse = await fetch('/assets/Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml');
      const characterResponse = await fetch('/assets/Content/Characters/Human/Human.xml');
      
      if (!ragdollResponse.ok || !characterResponse.ok) {
        throw new Error('Failed to load fallback files');
      }
      
      ragdollXmlText = await ragdollResponse.text();
      characterXmlText = await characterResponse.text();
    }
    
    const parser = new xml2js.Parser({ explicitArray: false });
    const ragdollResult = await parser.parseStringPromise(ragdollXmlText);
    const characterResult = await parser.parseStringPromise(characterXmlText);
    
    const ragdoll = ragdollResult.Ragdoll;
    const character = characterResult.Character || characterResult.Override?.Character;
    
    const mainTexture = processRagdollTexturePath(ragdoll, gender);
    
    const basePath = isElectronProduction() ? 'assets://Content/Characters/Human' : '/assets/Content/Characters/Human';
    
    return {
      character,
      ragdoll,
      mainTexture,
      ragdollsFolder: `${basePath}/Ragdolls`
    };
  } catch (error) {
    console.error('Fallback loading failed:', error);
    throw error;
  }
};

/**
 * Loads and parses filelist.xml to get all Item file paths
 * @returns {Promise<Array>} - Array of item file paths
 */
export const loadItemFilesFromFilelist = async () => {
  try {
    // Check if we're in Electron production environment
    
    
    let xmlText;
    
    if (isElectronProduction()) {
      // Use Electron API to read file
      if (window.electronAPI && window.electronAPI.readFile) {
        xmlText = await window.electronAPI.readFile('filelist.xml');
      } else {
        throw new Error('Electron API not available');
      }
    } else {
      // Use fetch for development
      const response = await fetch('/assets/filelist.xml');
      if (!response.ok) {
        throw new Error(`Failed to load filelist.xml: ${response.status} ${response.statusText}`);
      }
      xmlText = await response.text();
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const itemElements = xmlDoc.querySelectorAll('Item');
    const itemFiles = [];
    
    itemElements.forEach(itemElement => {
      const filePath = itemElement.getAttribute('file');
      if (filePath) {
        // Convert %ModDir% path to web path
        const webPath = convertGamePathToWebPath(filePath);
        itemFiles.push(webPath);
        // console.log(webPath);
      }
    });
    
    return itemFiles;
  } catch (error) {
    console.error('Error reading filelist.xml:', error);
    return [];
  }
};

/**
 * Processes texture path for clothing items
 * @param {string} texturePath - The texture path
 * @param {string} gender - Current gender ('male' or 'female')
 * @param {string} xmlPath - The XML file path for context (already converted to web path)
 * @returns {string} - The processed texture path
 */
export const processClothingTexturePath = (texturePath, gender, xmlPath) => {
  if (!texturePath) return '';
  
  // Replace [GENDER] or [gender] (case-insensitive) placeholder with actual gender
  let convertedPath = texturePath.replace(/\[gender\]/gi, gender);
  
  // Case 1: Just filename (e.g., "artiedolittle_2.png" or "Human_[GENDER].png") - same directory as XML
  if (convertedPath.includes('.png') && !convertedPath.includes('/')) {
    // Extract the directory from the XML path (xmlPath is already /assets/Content/...)
    const xmlDir = xmlPath.substring(0, xmlPath.lastIndexOf('/'));
    return `${xmlDir}/${convertedPath}`;
  }
  
  // Case 2: With %ModDir% prefix (e.g., "%ModDir%/Content/Items/Jobgear/Assistant/artiedolittle_2.png")
  // Support %ModDir% and %ModDir:xxxxxxxx% (case-insensitive, optional colon and digits)
  if (/%moddir(?::\d+)?%/i.test(convertedPath)) {
    const cleanPath = convertedPath.replace(/^%moddir(?::\d+)?%\//i, '');
    return `/assets/${cleanPath}`;
  }
  
  // Case 3: Relative to assets without %ModDir% (e.g., "Content/Items/Jobgear/Assistant/artiedolittle_2.png")
  // Check if we're in Electron production environment
  
  
  if (isElectronProduction()) {
    return `assets://${convertedPath}`;
  } else {
    return `/assets/${convertedPath}`;
  }
};

/**
 * Processes attachment texture path
 * @param {string} texturePath - The texture path from attachment
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {string} - The processed texture path
 */
export const processAttachmentTexturePath = (texturePath, gender) => {
  if (!texturePath) return '';
  
  // Handle %ModDir%/ prefix for texture paths (case-insensitive)
  let processedPath = texturePath;
  processedPath = removeModDirPrefix(processedPath);
  
  return convertTexturePathWithFallback(processedPath, gender);
}; 