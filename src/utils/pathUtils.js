import xml2js from 'xml2js';
import { convertTexturePath } from './textureUtils';

/**
 * Utility functions for parsing and resolving file paths in the Barotrauma character system
 */

/**
 * Converts a game path to a web-compatible path
 * @param {string} path - The original game path
 * @returns {string} - The converted web path
 */
export const convertGamePathToWebPath = (path) => {
  if (!path) return '';
  
  let convertedPath = path;
  
  // Handle %ModDir%/ prefix - convert to proper web path
  if (convertedPath.startsWith('%ModDir%/')) {
    convertedPath = convertedPath.replace('%ModDir%/', '');
  }
  
  // Convert to web path
  if (convertedPath.startsWith('Content/')) {
    convertedPath = `/assets/${convertedPath}`;
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
    // Handle %ModDir%/ prefix for ragdolls folder
    if (ragdollsFolder.startsWith('%ModDir%/')) {
      ragdollsFolder = ragdollsFolder.replace('%ModDir%/', '');
    }
    
    // Convert the ragdolls folder path
    if (ragdollsFolder.startsWith('Content/')) {
      ragdollsFolder = `/assets/${ragdollsFolder}`;
    }
  }
  
  return ragdollsFolder;
};

/**
 * Loads and parses filelist.xml to find Human.xml path
 * @returns {Promise<Object>} - Object containing humanXmlPath and filelistResult
 */
export const loadFilelistAndFindHumanXml = async () => {
  const filelistResponse = await fetch('/assets/filelist.xml');
  if (!filelistResponse.ok) {
    throw new Error(`Failed to load filelist.xml: ${filelistResponse.status} ${filelistResponse.statusText}`);
  }
  
  const filelistXmlText = await filelistResponse.text();
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
  const characterResponse = await fetch(humanXmlPath);
  if (!characterResponse.ok) {
    throw new Error(`Failed to load Human.xml: ${characterResponse.status} ${characterResponse.statusText}`);
  }
  
  const characterXmlText = await characterResponse.text();
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
  const ragdollPath = `${ragdollsFolder}/HumanDefaultRagdoll.xml`;
  const ragdollResponse = await fetch(ragdollPath);
  if (!ragdollResponse.ok) {
    throw new Error(`Failed to load HumanDefaultRagdoll.xml: ${ragdollResponse.status} ${ragdollResponse.statusText}`);
  }
  
  const ragdollXmlText = await ragdollResponse.text();
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
  if (mainTexturePath && mainTexturePath.startsWith('%ModDir%/')) {
    mainTexturePath = mainTexturePath.replace('%ModDir%/', '');
  }
  return convertTexturePath(mainTexturePath, gender);
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
  
  // Handle %ModDir%/ prefix for texture paths
  if (finalTexturePath && finalTexturePath.startsWith('%ModDir%/')) {
    finalTexturePath = finalTexturePath.replace('%ModDir%/', '');
  }
  
  return convertTexturePath(finalTexturePath, gender);
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
    const ragdollResponse = await fetch('/assets/Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml');
    const characterResponse = await fetch('/assets/Content/Characters/Human/Human.xml');
    
    if (!ragdollResponse.ok || !characterResponse.ok) {
      throw new Error('Failed to load fallback files');
    }
    
    const ragdollXmlText = await ragdollResponse.text();
    const characterXmlText = await characterResponse.text();
    
    const parser = new xml2js.Parser({ explicitArray: false });
    const ragdollResult = await parser.parseStringPromise(ragdollXmlText);
    const characterResult = await parser.parseStringPromise(characterXmlText);
    
    const ragdoll = ragdollResult.Ragdoll;
    const character = characterResult.Character || characterResult.Override?.Character;
    
    const mainTexture = processRagdollTexturePath(ragdoll, gender);
    
    return {
      character,
      ragdoll,
      mainTexture,
      ragdollsFolder: '/assets/Content/Characters/Human/Ragdolls'
    };
  } catch (error) {
    console.error('Fallback loading failed:', error);
    throw error;
  }
}; 