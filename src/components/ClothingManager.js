import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { parseSpriteAttributes } from '../utils/xmlUtils';

// Read filelist.xml and get all Item file paths
const getItemFilesFromFilelist = async () => {
  try {
    const response = await fetch('/assets/filelist.xml');
    if (!response.ok) {
      throw new Error(`Failed to load filelist.xml: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const itemElements = xmlDoc.querySelectorAll('Item');
    const itemFiles = [];
    
    itemElements.forEach(itemElement => {
      const filePath = itemElement.getAttribute('file');
      if (filePath) {
        // Convert %ModDir% path to web path
        const webPath = filePath.replace('%ModDir%/', '');
        itemFiles.push(webPath);
      }
    });
    
    return itemFiles;
  } catch (error) {
    console.error('Error reading filelist.xml:', error);
    return [];
  }
};

// Get all items that have Wearable element from a single XML file
const parseClothingItemsFromFile = async (xmlPath) => {
  try {
    const response = await fetch(`/assets/${xmlPath}`);
    if (!response.ok) {
      console.warn(`Failed to load ${xmlPath}: ${response.status} ${response.statusText}`);
      return [];
    }
    const xmlText = await response.text();
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
    const response = await fetch(`/assets/${xmlPath}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${xmlPath}: ${response.status} ${response.statusText}`);
    }
    const xmlText = await response.text();
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
  if (!texturePath) return '';
  
  // Replace [GENDER] placeholder with actual gender
  let convertedPath = texturePath.replace('[GENDER]', gender);
  
  // Case 1: Just filename (e.g., "artiedolittle_2.png" or "Human_[GENDER].png") - same directory as XML
  if (convertedPath.includes('.png') && !convertedPath.includes('/')) {
    // Extract the directory from the XML path
    const xmlDir = xmlPath.substring(0, xmlPath.lastIndexOf('/'));
    return `/assets/${xmlDir}/${convertedPath}`;
  }
  
  // Case 2: With %ModDir% prefix (e.g., "%ModDir%/Content/Items/Jobgear/Assistant/artiedolittle_2.png")
  if (convertedPath.includes('%ModDir%')) {
    const cleanPath = convertedPath.replace('%ModDir%/', '');
    return `/assets/${cleanPath}`;
  }
  
  // Case 3: Relative to assets without %ModDir% (e.g., "Content/Items/Jobgear/Assistant/artiedolittle_2.png")
  return `/assets/${convertedPath}`;
};

const ClothingManager = ({ gender, limbs, onClothingUpdate }) => {
  const [clothingSprites, setClothingSprites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [itemIdentifier, setItemIdentifier] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemXmlPath, setSelectedItemXmlPath] = useState('');
  const draggableRef = useRef(null);

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
        const processedSprites = sprites.map(sprite => ({
          ...sprite,
          texturePath: processTexturePath(sprite.texture, gender, xmlPath)
        }));
        setClothingSprites(processedSprites);
        onClothingUpdate(processedSprites);
      }
    } catch (error) {
      console.error('Error loading clothing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeClothing = () => {
    setClothingSprites([]);
    onClothingUpdate([]);
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
        // console.log('useEffect: Initial load', { selectedItem, xmlPath: selectedItemData.xmlPath });
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
      // console.log('useEffect: Single filtered item detected', { 
      //   singleItem: singleItem.identifier, 
      //   currentSelected: selectedItem,
      //   searchTerm 
      // });
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
    <Draggable nodeRef={draggableRef}>
      <div 
        ref={draggableRef}
        style={{
          position: 'absolute',
          top: '500px', 
          left: '230px', 
          zIndex: 2000,
          backgroundColor: '#2a2a2a',
          border: '1px solid #555',
          borderRadius: '5px',
          width: '250px',
          minWidth: '200px',
          color: 'white',
          padding: '8px',
          fontSize: '8px',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '8px',
          cursor: 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #555',
          backgroundColor: '#3a3a3a',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          <span>Clothing Manager</span>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 8px',
              borderRadius: '3px',
              fontSize: '10px',
            }}
          >
            {isCollapsed ? '+' : '-'}
          </button>
        </div>
        {!isCollapsed && (
          <div style={{ padding: '8px 0 0 0' }}>
            {/* Search and dropdown menu */}
            <div style={{ marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Search clothing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '10px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  color: 'white',
                  marginBottom: '4px'
                }}
              />
              <select
                value={selectedItem}
                onChange={(e) => {
                  const newSelectedItem = e.target.value;
                  setSelectedItem(newSelectedItem);
                  
                  // Immediately find and load the selected item
                  const selectedItemData = availableItems.find(item => item.identifier === newSelectedItem);
                  if (selectedItemData) {
                    // console.log('select onChange: Loading item', { 
                    //   newSelectedItem, 
                    //   xmlPath: selectedItemData.xmlPath,
                    //   searchTerm,
                    //   filteredItemsCount: filteredItems.length
                    // });
                    setSelectedItemXmlPath(selectedItemData.xmlPath);
                    setItemIdentifier(selectedItemData.identifier);
                    loadClothing(selectedItemData.identifier, selectedItemData.xmlPath);
                  } else {
                    // console.warn('select onChange: Item not found', { newSelectedItem, availableItemsCount: availableItems.length });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '10px',
                  backgroundColor: '#3a3a3a',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  color: 'white'
                }}
              >
                {filteredItems.map(item => (
                  <option key={item.identifier} value={item.identifier}>
                    {item.name || item.identifier}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
              Item: <span style={{ fontWeight: 'normal', fontSize: '10px' }}>{itemIdentifier}</span>
              <br />
              <span style={{ fontWeight: 'normal', fontSize: '8px', color: '#aaa' }}>
                From: {selectedItemXmlPath}
              </span>
              <br />
              <button
                onClick={() => loadClothing()}
                disabled={isLoading}
                style={{
                  background: isLoading ? '#666' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  float: 'center',
                  marginLeft: '4px',
                }}
              >
                {isLoading ? 'Loading...' : 'Reload'}
              </button>
              <button
                onClick={removeClothing}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '9px',
                  float: 'center',
                }}
              >
                Remove
              </button>
              <br/>
            </div>
            {/* Compact 2-column sprite info table */}
            <div style={{ width: '100%', marginTop: '4px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                <tbody>
                  {getSpriteRows(clothingSprites).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((sprite, colIdx) =>
                        sprite ? (
                          <td
                            key={colIdx}
                            style={{
                              borderBottom: '1px solid #444',
                              padding: '2px 2px',
                              verticalAlign: 'top',
                              wordBreak: 'break-all',
                              width: '50%',
                            }}
                          >
                            <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{sprite.name}</div>
                            <div style={{ color: '#aaa', fontSize: '8px' }}>{sprite.limb}</div>
                            <div style={{ color: '#ccc', fontSize: '8px' }}>{sprite.texturePath.split('/').pop()}</div>
                          </td>
                        ) : (
                          <td key={colIdx} style={{ width: '50%' }} />
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default ClothingManager; 