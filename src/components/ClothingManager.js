import React, { useState, useEffect } from 'react';
import { parseSpriteAttributes } from '../utils/xmlUtils';
import { loadItemFilesFromFilelist, processClothingTexturePath, readFile } from '../utils/pathUtils';
import useCharacterStore from '../store/characterStore';
import Panel from './Panel';
import './ClothingManager.css';

// Read filelist.xml and get all Item file paths
const getItemFilesFromFilelist = async () => {
  return await loadItemFilesFromFilelist();
};

// Get all items that have Wearable element from a single XML file
const parseClothingItemsFromFile = async (xmlPath) => {
  try {
    // xmlPath is already a full web path (e.g., /assets/Content/Items/...)
    const xmlText = await readFile(xmlPath);
    if (!xmlText) {
      console.warn(`Failed to load ${xmlPath}`);
      return [];
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const items = [];
    const itemElements = xmlDoc.querySelectorAll('Item');
    
    itemElements.forEach(itemElement => {
      const identifier = itemElement.getAttribute('identifier');
      const name = itemElement.getAttribute('name') || identifier;
      const wearableElement = itemElement.querySelector('Wearable');
      
      // Only get items that have Wearable element
      if (wearableElement) {
        items.push({
          identifier,
          name,
          xmlPath, // Store the source XML file path
          element: itemElement
        });
      }
    });

    return items;
  } catch (error) {
    console.error(`Error parsing clothing XML ${xmlPath}:`, error);
    return [];
  }
};

// Get all items that have Wearable element from all Item files
const parseAllClothingItems = async () => {
  try {
    const itemFiles = await getItemFilesFromFilelist();
    console.log('Found item files:', itemFiles);
    
    const allItems = [];
    
    // Parse each Item file
    for (const xmlPath of itemFiles) {
      try {
        const items = await parseClothingItemsFromFile(xmlPath);
        allItems.push(...items);
      } catch (error) {
        console.error(`Error parsing ${xmlPath}:`, error);
        // Continue with other files even if one fails
      }
    }
    
    console.log(`Total clothing items found: ${allItems.length}`);
    return allItems;
  } catch (error) {
    console.error('Error parsing all clothing items:', error);
    return [];
  }
};

// Parse clothing XML file
const parseClothingXML = async (xmlPath, selectedItemIdentifier) => {
  try {
    // xmlPath is already a full web path (e.g., /assets/Content/Items/...)
    const xmlText = await readFile(xmlPath);
    if (!xmlText) {
      throw new Error(`Failed to load ${xmlPath}`);
    }
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Find the specified Item
    const itemElement = xmlDoc.querySelector(`Item[identifier="${selectedItemIdentifier}"]`);
    if (!itemElement) {
      console.error(`Item with identifier ${selectedItemIdentifier} not found in ${xmlPath}`);
      return null;
    }

    // Find Wearable element
    const wearableElement = itemElement.querySelector('Wearable');
    if (!wearableElement) {
      console.error('No Wearable element found in clothing XML');
      return null;
    }

    const sprites = [];
    const spriteElements = wearableElement.querySelectorAll('sprite');
    
    spriteElements.forEach(spriteElement => {
      // Use the robust parsing utility
      const spriteData = parseSpriteAttributes(spriteElement);
      
      if (!spriteData || !spriteData.limb) {
        console.error(`Sprite ${spriteData?.name || 'unknown'} missing limb attribute`);
        return;
      }

      sprites.push(spriteData);
    });

    return sprites;
  } catch (error) {
    console.error('Error parsing clothing XML:', error);
    return null;
  }
};

// Process texture path
const processTexturePath = (texturePath, gender, xmlPath) => {
  return processClothingTexturePath(texturePath, gender, xmlPath);
};

const ClothingManager = () => {
  const {
    gender,
    clothingSprites,
    setClothingSprites,
  } = useCharacterStore();

  const [isLoading, setIsLoading] = useState(false);
  const [itemIdentifier, setItemIdentifier] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemXmlPath, setSelectedItemXmlPath] = useState('');

  // Load all available clothing items from all Item files
  const loadAvailableItems = async () => {
    try {
      setIsLoading(true);
      const items = await parseAllClothingItems();
      setAvailableItems(items);
      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0].identifier);
        setSelectedItemXmlPath(items[0].xmlPath);
      }
    } catch (error) {
      console.error('Error loading available items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClothing = async (itemIdentifier = selectedItem, xmlPath = selectedItemXmlPath) => {
    if (!itemIdentifier || !xmlPath) {
      console.warn('loadClothing: Missing itemIdentifier or xmlPath', { itemIdentifier, xmlPath });
      return;
    }
    
    setIsLoading(true);
    try {
      // Parse Wearable sprites
      const sprites = await parseClothingXML(xmlPath, itemIdentifier);
      if (sprites) {
        const processedSprites = sprites.map(sprite => {
          const originalData = {
            sourceRect: sprite.sourceRect,
            origin: sprite.origin,
            scale: sprite.scale,
            inheritSourceRect: sprite.inheritSourceRect,
            inheritOrigin: sprite.inheritOrigin,
          };
          return {
            ...sprite,
            texturePath: processTexturePath(sprite.texture, gender, xmlPath),
            original: originalData,
          }
        });
        setClothingSprites(processedSprites);
      }
    } catch (error) {
      console.error('Error loading clothing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeClothing = () => {
    setClothingSprites([]);
  };

  useEffect(() => {
    loadAvailableItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter search results
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.identifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedItem && availableItems.length > 0) {
      // This useEffect is now mainly for initial load and gender changes
      // The main item switching logic is handled in the select onChange
      const selectedItemData = availableItems.find(item => item.identifier === selectedItem);
      if (selectedItemData && !selectedItemXmlPath) {
        // Only set XML path if it's not already set (initial load case)
        setSelectedItemXmlPath(selectedItemData.xmlPath);
        setItemIdentifier(selectedItemData.identifier);
        loadClothing(selectedItemData.identifier, selectedItemData.xmlPath);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, availableItems]);

  // Handle single filtered item case
  useEffect(() => {
    if (searchTerm && filteredItems.length === 1 && filteredItems[0].identifier !== selectedItem) {
      // When search results in exactly one item and it's different from current selection
      const singleItem = filteredItems[0];
      setSelectedItem(singleItem.identifier);
      setSelectedItemXmlPath(singleItem.xmlPath);
      setItemIdentifier(singleItem.identifier);
      loadClothing(singleItem.identifier, singleItem.xmlPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems, searchTerm]);

  useEffect(() => {
    if (selectedItem && selectedItemXmlPath && gender) {
      // Only reload if gender changes (XML path and item are already handled above)
      loadClothing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);


  // Helper: group sprites into rows of 2
  const getSpriteRows = (sprites) => {
    const rows = [];
    for (let i = 0; i < sprites.length; i += 2) {
      rows.push([sprites[i], sprites[i + 1]]);
    }
    return rows;
  };

  return (
    <Panel title="Clothing Manager" isOpenInitially={true} position={{ x: 230, y: 500 }}>
      <div className="clothing-manager-container">
        {/* Search and dropdown menu */}
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Search clothing..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="clothing-search-input"
          />
          <select
            value={selectedItem}
            onChange={(e) => {
              const newSelectedItem = e.target.value;
              setSelectedItem(newSelectedItem);
              
              const selectedItemData = availableItems.find(item => item.identifier === newSelectedItem);
              if (selectedItemData) {
                setSelectedItemXmlPath(selectedItemData.xmlPath);
                setItemIdentifier(selectedItemData.identifier);
                loadClothing(selectedItemData.identifier, selectedItemData.xmlPath);
              }
            }}
            className="clothing-select"
          >
            {filteredItems.map(item => (
              <option key={item.identifier} value={item.identifier}>
                {item.name || item.identifier}
              </option>
            ))}
          </select>
        </div>

        <div className="clothing-info">
          Item: <span>{itemIdentifier}</span>
          <br />
          <span className="path">From: {selectedItemXmlPath}</span>
          <br />
          <button
            onClick={() => loadClothing()}
            disabled={isLoading}
            className={`clothing-button reload ${isLoading ? 'disabled' : ''}`}
          >
            {isLoading ? 'Loading...' : 'Reload'}
          </button>
          <button
            onClick={removeClothing}
            className="clothing-button remove"
          >
            Remove
          </button>
          <br/>
        </div>
        {/* Compact 2-column sprite info table */}
        <div className="clothing-sprite-table">
          <table>
            <tbody>
              {getSpriteRows(clothingSprites).map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((sprite, colIdx) =>
                    sprite ? (
                      <td key={colIdx}>
                        <div className="clothing-sprite-name">{sprite.name}</div>
                        <div className="clothing-sprite-limb">{sprite.limb}</div>
                        <div className="clothing-sprite-texture">{sprite.texturePath.split('/').pop()}</div>
                      </td>
                    ) : (
                      <td key={colIdx} />
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
};

export default ClothingManager;