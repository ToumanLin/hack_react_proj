/**
 * XML parsing utility example
 * Shows how to use the new robust XML parsing utility
 */

import { 
  getAttribute, 
  getXml2jsAttribute, 
  parseNumberArray, 
  parseFloat,
  parseSpriteAttributes,
  parseSpriteAttributesFromXml2js 
} from './xmlUtils';

// Example 1: Using native DOM parsing
export const exampleDomParsing = () => {
  // Assume we have an XML element
  const xmlString = `
    <sprite name="Pirate Uniform 2 Right Lower Arm" 
            texture="pirate_2.png" 
            limb="RightArm" 
            hidelimb="false" 
            inherittexturescale="true" 
            inheritorigin="true" 
            inheritsourcerect="true" 
            SourceRect="272,0,64,92.5" 
            Origin="0.5,0.518919" />
  `;
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const spriteElement = xmlDoc.querySelector('sprite');
  
  // Use robust attribute parsing
  const spriteData = parseSpriteAttributes(spriteElement);
  
  console.log('Parsed sprite data:', spriteData);
  // Output:
  // {
  //   name: "Pirate Uniform 2 Right Lower Arm",
  //   texture: "pirate_2.png",
  //   limb: "RightArm",
  //   hidelimb: false,
  //   depthLimb: null,
  //   inheritLimbDepth: true,
  //   depth: null,
  //   inheritTextureScale: true,
  //   scale: 0.5,
  //   inheritOrigin: true,
  //   origin: [0.5, 0.518919],
  //   inheritSourceRect: true,
  //   sourceRect: [272, 0, 64, 92.5]
  // }
};

// Example 2: Using xml2js parsing
export const exampleXml2jsParsing = () => {
  // Simulate xml2js parsed object
  const xml2jsResult = {
    sprite: {
      $: {
        name: "Pirate Uniform 2 Right Lower Arm",
        texture: "pirate_2.png",
        limb: "RightArm",
        hidelimb: "false",
        inheritsourcerect: "true",
        SourceRect: "272,0,64,92.5",  // Note: SourceRect is uppercase
        Origin: "0.5,0.518919"        // Note: Origin is uppercase
      }
    }
  };
  
  // Use robust attribute parsing
  const spriteData = parseSpriteAttributesFromXml2js(xml2jsResult.sprite);
  
  console.log('Parsed sprite data from xml2js:', spriteData);
  // Output same result, even if XML uses uppercase attribute names
};

// Example 3: Manually using single parsing function
export const exampleManualParsing = () => {
  const xmlString = `
    <limb id="Torso" 
          Name="Torso" 
          Type="Torso" 
          Scale="1.0" 
          Depth="0" 
          Origin="0.5,0.5" 
          SourceRect="0,0,64,64" 
          Texture="Content/Characters/Human/Human_[GENDER].png" />
  `;
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const limbElement = xmlDoc.querySelector('limb');
  
  // Manually parse each attribute
  const id = getAttribute(limbElement, 'id', '');
  const name = getAttribute(limbElement, 'name', '');  // Will automatically find Name attribute
  const type = getAttribute(limbElement, 'type', '');  // Will automatically find Type attribute
  const scale = parseFloat(getAttribute(limbElement, 'scale', '1'));
  const depth = parseFloat(getAttribute(limbElement, 'depth', '0'));
  const origin = parseNumberArray(getAttribute(limbElement, 'origin', '0.5,0.5'));
  const sourceRect = parseNumberArray(getAttribute(limbElement, 'sourcerect', null));
  const texture = getAttribute(limbElement, 'texture', '');
  
  console.log('Manually parsed limb data:', {
    id,
    name,
    type,
    scale,
    depth,
    origin,
    sourceRect,
    texture
  });
};

// Example 4: Handling various case variants
export const exampleCaseVariants = () => {
  const testCases = [
    // Original DOM element
    { element: createTestElement('sourcerect', '100,200,300,400') },
    { element: createTestElement('SourceRect', '100,200,300,400') },
    { element: createTestElement('sourceRect', '100,200,300,400') },
    { element: createTestElement('SOURCERECT', '100,200,300,400') },
    
    // xml2js object
    { xml2js: createTestXml2js('sourcerect', '100,200,300,400') },
    { xml2js: createTestXml2js('SourceRect', '100,200,300,400') },
    { xml2js: createTestXml2js('sourceRect', '100,200,300,400') },
    { xml2js: createTestXml2js('SOURCERECT', '100,200,300,400') },
  ];
  
  testCases.forEach((testCase, index) => {
    let result;
    if (testCase.element) {
      result = parseNumberArray(getAttribute(testCase.element, 'sourcerect'));
    } else {
      result = parseNumberArray(getXml2jsAttribute(testCase.xml2js, 'sourcerect'));
    }
    
    console.log(`Test case ${index + 1}:`, result);
    // All test cases should output: [100, 200, 300, 400]
  });
};

// Helper function
function createTestElement(attrName, attrValue) {
  const element = document.createElement('div');
  element.setAttribute(attrName, attrValue);
  return element;
}

function createTestXml2js(attrName, attrValue) {
  return {
    $: {
      [attrName]: attrValue
    }
  };
}

// Export example functions
export const runAllExamples = () => {
  console.log('=== XML parsing utility example ===');
  
  console.log('\n1. DOM parsing example:');
  exampleDomParsing();
  
  console.log('\n2. xml2js parsing example:');
  exampleXml2jsParsing();
  
  console.log('\n3. Manual parsing example:');
  exampleManualParsing();
  
  console.log('\n4. Case variant test:');
  exampleCaseVariants();
}; 