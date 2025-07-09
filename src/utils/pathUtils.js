import xml2js from 'xml2js';
import { convertTexturePathWithFallback } from './textureUtils';
import { isElectronProduction } from './envUtils';
import { logInfo, logError, logFileError, logXmlError } from './logger';

/**
 * Utility functions for parsing and resolving file paths in the Barotrauma character system
 */

// Helper: Remove %ModDir%/ or %moddir%/ prefix (case-insensitive)
const removeModDirPrefix = (path) => {
  if (!path) return path;
  return path.replace(/^%moddir(?::\d+)?%\//i, '');
};

export const readFile = async (path) => {
  // logInfo('FileRead', `Attempting to read file: ${path}`);
  
  try {
    if (isElectronProduction()) {
      if (window.electronAPI && window.electronAPI.readFile) {
        // In production, paths passed here are relative to the 'assets' root inside app.asar
        // e.g., 'filelist.xml' or 'Content/Characters/Human/Human.xml'
        const content = await window.electronAPI.readFile(path);
        // logInfo('FileRead', `Successfully read file: ${path}`, { contentLength: content?.length || 0 });
        return content;
      } else {
        const error = new Error('Electron API not available in production environment');
        logError('FileRead', error, { path, environment: 'production' });
        throw error;
      }
    } else {
      // In development, path is a full URL like '/assets/filelist.xml'
      const response = await fetch(path);
      if (!response.ok) {
        const error = new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
        logFileError('FileRead', path, error, { 
          status: response.status, 
          statusText: response.statusText,
          environment: 'development' 
        });
        throw error;
      }
      const content = await response.text();
      // logInfo('FileRead', `Successfully read file: ${path}`, { contentLength: content?.length || 0 });
      return content;
    }
  } catch (error) {
    logFileError('FileRead', path, error, { environment: isElectronProduction() ? 'production' : 'development' });
    throw error;
  }
};

/**
 * Converts a game path to a web-compatible path
 * @param {string} path - The original game path
 * @returns {string} - The converted web path
 */
export const convertGamePathToWebPath = (path) => {
  if (!path) return '';
  
  let convertedPath = path;
  convertedPath = removeModDirPrefix(convertedPath);
  
  // In production, we want a path relative to the assets dir, e.g., "Content/Characters/Human.xml"
  // In development, we want a web-accessible path, e.g., "/assets/Content/Characters/Human.xml"
  if (isElectronProduction()) {
    return convertedPath;
  } else {
    if (convertedPath.startsWith('Content/')) {
        return `/assets/${convertedPath}`;
    }
    return convertedPath; // Should already be a web path in dev
  }
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
  logInfo('RagdollsPath', 'Resolving ragdolls folder path', { humanXmlPath });
  
  const ragdollsElement = character.ragdolls;
  if (!ragdollsElement || !ragdollsElement.$.folder) {
    const error = new Error('Ragdolls folder not found in Human.xml');
    logError('RagdollsPath', error, { 
      humanXmlPath, 
      hasRagdollsElement: !!ragdollsElement,
      ragdollsFolder: ragdollsElement?.$.folder 
    });
    throw error;
  }
  
  let ragdollsFolder = ragdollsElement.$.folder;
  logInfo('RagdollsPath', 'Found ragdolls folder in XML', { originalFolder: ragdollsFolder });
  
  // Handle relative path "default" - it means same directory as Human.xml
  if (ragdollsFolder === 'default') {
    // Extract the directory path from Human.xml path
    const humanXmlDir = humanXmlPath.substring(0, humanXmlPath.lastIndexOf('/'));
    ragdollsFolder = `${humanXmlDir}/Ragdolls`;
    logInfo('RagdollsPath', 'Using default ragdolls path', { resolvedPath: ragdollsFolder });
  } else {
    // Handle %ModDir%/ prefix for ragdolls folder (case-insensitive)
    const originalFolder = ragdollsFolder;
    ragdollsFolder = removeModDirPrefix(ragdollsFolder);
    logInfo('RagdollsPath', 'Removed ModDir prefix', { original: originalFolder, processed: ragdollsFolder });
    
    // Convert the ragdolls folder path
    if (ragdollsFolder.startsWith('Content/')) {
      if (isElectronProduction()) {
        // ragdollsFolder is already correct, no change needed.
      } else {
        ragdollsFolder = `/assets/${ragdollsFolder}`;
      }
      logInfo('RagdollsPath', 'Converted Content path', { finalPath: ragdollsFolder });
    }
  }
  
  logInfo('RagdollsPath', 'Successfully resolved ragdolls folder path', { finalPath: ragdollsFolder });
  return ragdollsFolder;
};

/**
 * Loads and parses filelist.xml to find Human.xml path
 * @returns {Promise<Object>} - Object containing humanXmlPath and filelistResult
 */
export const loadFilelistAndFindHumanXml = async () => {
  logInfo('FilelistLoad', 'Starting to load filelist.xml and find Human.xml');
  
  try {
    const filelistPath = isElectronProduction() ? 'filelist.xml' : '/assets/filelist.xml';
    const filelistXmlText = await readFile(filelistPath);
    
    logInfo('FilelistLoad', 'Successfully read filelist.xml', { contentLength: filelistXmlText?.length || 0 });
    
    const filelistParser = new xml2js.Parser({ explicitArray: false });
    const filelistResult = await filelistParser.parseStringPromise(filelistXmlText);
    
    logInfo('FilelistLoad', 'Successfully parsed filelist.xml');
    
    const humanFileEntry = findHumanXmlEntry(filelistResult);
    if (!humanFileEntry) {
      const error = new Error('Human.xml not found in filelist.xml');
      logError('FilelistLoad', error, { 
        hasCharacterFiles: !!filelistResult.contentpackage?.Character,
        characterFilesCount: Array.isArray(filelistResult.contentpackage?.Character) 
          ? filelistResult.contentpackage.Character.length 
          : filelistResult.contentpackage?.Character ? 1 : 0
      });
      throw error;
    }
    
    logInfo('FilelistLoad', 'Found Human.xml entry in filelist', { 
      originalPath: humanFileEntry.$.file 
    });
    
    // Extract the Human.xml path and convert it
    let humanXmlPath = humanFileEntry.$.file;
    humanXmlPath = convertGamePathToWebPath(humanXmlPath);
    
    logInfo('FilelistLoad', 'Successfully converted Human.xml path', { 
      originalPath: humanFileEntry.$.file,
      convertedPath: humanXmlPath 
    });
    
    return { humanXmlPath, filelistResult };
  } catch (error) {
    logError('FilelistLoad', error, { 
      filelistPath: isElectronProduction() ? 'filelist.xml' : '/assets/filelist.xml' 
    });
    throw error;
  }
};

/**
 * Loads and parses Human.xml to get character data and ragdolls folder
 * @param {string} humanXmlPath - The path to Human.xml
 * @returns {Promise<Object>} - Object containing character data and ragdolls folder path
 */
export const loadHumanXmlAndGetRagdollsPath = async (humanXmlPath) => {
  logInfo('HumanXmlLoad', 'Starting to load Human.xml', { humanXmlPath });
  
  try {
    const characterXmlText = await readFile(humanXmlPath);
    
    logInfo('HumanXmlLoad', 'Successfully read Human.xml', { contentLength: characterXmlText?.length || 0 });
    
    const characterParser = new xml2js.Parser({ explicitArray: false });
    const characterResult = await characterParser.parseStringPromise(characterXmlText);
    
    logInfo('HumanXmlLoad', 'Successfully parsed Human.xml');
    
    // Handle both direct Character and Override.Character structures
    const character = characterResult.Character || characterResult.Override?.Character;
    
    if (!character) {
      const error = new Error('Character data not found in Human.xml');
      logError('HumanXmlLoad', error, { 
        humanXmlPath,
        hasCharacter: !!characterResult.Character,
        hasOverride: !!characterResult.Override,
        hasOverrideCharacter: !!characterResult.Override?.Character,
        availableKeys: Object.keys(characterResult)
      });
      throw error;
    }
    
    logInfo('HumanXmlLoad', 'Found character data in Human.xml', { 
      hasDirectCharacter: !!characterResult.Character,
      hasOverrideCharacter: !!characterResult.Override?.Character 
    });
    
    const ragdollsFolder = resolveRagdollsFolderPath(character, humanXmlPath);
    
    logInfo('HumanXmlLoad', 'Successfully loaded Human.xml and resolved ragdolls path', { 
      ragdollsFolder 
    });
    
    return { character, ragdollsFolder };
  } catch (error) {
    logXmlError('HumanXmlLoad', humanXmlPath, error);
    throw error;
  }
};

/**
 * Loads and parses the ragdoll XML file
 * @param {string} ragdollsFolder - The ragdolls folder path
 * @returns {Promise<Object>} - Parsed ragdoll data
 */
export const loadRagdollXml = async (ragdollsFolder) => {
  const ragdollPath = `${ragdollsFolder}/HumanDefaultRagdoll.xml`;
  logInfo('RagdollXmlLoad', 'Starting to load HumanDefaultRagdoll.xml', { ragdollPath });
  
  try {
    const ragdollXmlText = await readFile(ragdollPath);
    
    logInfo('RagdollXmlLoad', 'Successfully read HumanDefaultRagdoll.xml', { 
      contentLength: ragdollXmlText?.length || 0 
    });
    
    const ragdollParser = new xml2js.Parser({ explicitArray: false });
    const ragdollResult = await ragdollParser.parseStringPromise(ragdollXmlText);
    
    logInfo('RagdollXmlLoad', 'Successfully parsed HumanDefaultRagdoll.xml');
    
    if (!ragdollResult.Ragdoll) {
      const error = new Error('Ragdoll data not found in HumanDefaultRagdoll.xml');
      logError('RagdollXmlLoad', error, { 
        ragdollPath,
        availableKeys: Object.keys(ragdollResult)
      });
      throw error;
    }
    
    logInfo('RagdollXmlLoad', 'Successfully loaded HumanDefaultRagdoll.xml', { 
      hasLimbData: !!ragdollResult.Ragdoll.limb,
      limbCount: Array.isArray(ragdollResult.Ragdoll.limb) 
        ? ragdollResult.Ragdoll.limb.length 
        : ragdollResult.Ragdoll.limb ? 1 : 0,
      hasJointData: !!ragdollResult.Ragdoll.joint,
      jointCount: Array.isArray(ragdollResult.Ragdoll.joint) 
        ? ragdollResult.Ragdoll.joint.length 
        : ragdollResult.Ragdoll.joint ? 1 : 0
    });
    
    return ragdollResult.Ragdoll;
  } catch (error) {
    logXmlError('RagdollXmlLoad', ragdollPath, error);
    throw error;
  }
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
  logInfo('CharacterDataLoad', 'Starting to load character data', { gender });
  
  try {
    // Step 1: Load filelist.xml and find Human.xml path
    logInfo('CharacterDataLoad', 'Step 1: Loading filelist.xml and finding Human.xml path');
    const { humanXmlPath } = await loadFilelistAndFindHumanXml();
    
    // Step 2: Load Human.xml and get ragdolls folder path
    logInfo('CharacterDataLoad', 'Step 2: Loading Human.xml and resolving ragdolls path');
    const { character, ragdollsFolder } = await loadHumanXmlAndGetRagdollsPath(humanXmlPath);
    
    // Step 3: Load ragdoll XML
    logInfo('CharacterDataLoad', 'Step 3: Loading HumanDefaultRagdoll.xml');
    const ragdoll = await loadRagdollXml(ragdollsFolder);
    
    // Step 4: Process main texture path
    logInfo('CharacterDataLoad', 'Step 4: Processing main texture path');
    const mainTexture = processRagdollTexturePath(ragdoll, gender);
    
    logInfo('CharacterDataLoad', 'Successfully loaded all character data', {
      gender,
      humanXmlPath,
      ragdollsFolder,
      mainTexture,
      hasCharacterData: !!character,
      hasRagdollData: !!ragdoll
    });
    
    return {
      character,
      ragdoll,
      mainTexture,
      ragdollsFolder
    };
  } catch (error) {
    logError('CharacterDataLoad', error, { gender });
    throw error;
  }
};

/**
 * Fallback function to load data using hardcoded paths
 * @param {string} gender - Current gender ('male' or 'female')
 * @returns {Promise<Object>} - Object containing all loaded data
 */
export const loadCharacterDataFallback = async (gender) => {
  logInfo('CharacterDataFallback', 'Starting fallback character data loading', { gender });
  
  try {
    const ragdollPath = isElectronProduction() ? 'Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml' : '/assets/Content/Characters/Human/Ragdolls/HumanDefaultRagdoll.xml';
    const characterPath = isElectronProduction() ? 'Content/Characters/Human/Human.xml' : '/assets/Content/Characters/Human/Human.xml';
    
    logInfo('CharacterDataFallback', 'Loading files using hardcoded paths', { 
      ragdollPath, 
      characterPath 
    });
    
    const ragdollXmlText = await readFile(ragdollPath);
    const characterXmlText = await readFile(characterPath);
    
    logInfo('CharacterDataFallback', 'Successfully read fallback files', {
      ragdollContentLength: ragdollXmlText?.length || 0,
      characterContentLength: characterXmlText?.length || 0
    });
    
    const parser = new xml2js.Parser({ explicitArray: false });
    const ragdollResult = await parser.parseStringPromise(ragdollXmlText);
    const characterResult = await parser.parseStringPromise(characterXmlText);
    
    logInfo('CharacterDataFallback', 'Successfully parsed fallback XML files');
    
    const ragdoll = ragdollResult.Ragdoll;
    const character = characterResult.Character || characterResult.Override?.Character;
    
    if (!ragdoll) {
      const error = new Error('Ragdoll data not found in fallback HumanDefaultRagdoll.xml');
      logError('CharacterDataFallback', error, { 
        ragdollPath,
        availableKeys: Object.keys(ragdollResult)
      });
      throw error;
    }
    
    if (!character) {
      const error = new Error('Character data not found in fallback Human.xml');
      logError('CharacterDataFallback', error, { 
        characterPath,
        hasCharacter: !!characterResult.Character,
        hasOverride: !!characterResult.Override,
        availableKeys: Object.keys(characterResult)
      });
      throw error;
    }
    
    const mainTexture = processRagdollTexturePath(ragdoll, gender);
    
    const basePath = isElectronProduction() ? 'assets://Content/Characters/Human' : '/assets/Content/Characters/Human';
    const ragdollsFolder = `${basePath}/Ragdolls`;
    
    logInfo('CharacterDataFallback', 'Successfully loaded fallback character data', {
      gender,
      mainTexture,
      ragdollsFolder,
      hasCharacterData: !!character,
      hasRagdollData: !!ragdoll
    });
    
    return {
      character,
      ragdoll,
      mainTexture,
      ragdollsFolder
    };
  } catch (error) {
    logError('CharacterDataFallback', error, { gender });
    throw error;
  }
};

/**
 * Loads and parses filelist.xml to get all Item file paths
 * @returns {Promise<Array>} - Array of item file paths
 */
export const loadItemFilesFromFilelist = async () => {
  try {
    const xmlText = await readFile(isElectronProduction() ? 'filelist.xml' : '/assets/filelist.xml');
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
  
  let convertedPath = texturePath.replace(/\[gender\]/gi, gender);
  
  if (convertedPath.includes('.png') && !convertedPath.includes('/')) {
    const xmlDir = xmlPath.substring(0, xmlPath.lastIndexOf('/'));
    return `${xmlDir}/${convertedPath}`;
  }
  
  convertedPath = removeModDirPrefix(convertedPath);

  if (isElectronProduction()) {
      return convertedPath; // e.g. Content/Items/Jobgear/bandana.png
  } else {
      return `/assets/${convertedPath}`; // e.g. /assets/Content/Items/Jobgear/bandana.png
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