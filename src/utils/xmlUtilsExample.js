/**
 * XML解析工具使用示例
 * 展示如何使用新的健壮XML解析工具
 */

import { 
  getAttribute, 
  getXml2jsAttribute, 
  parseNumberArray, 
  parseBoolean, 
  parseFloat,
  parseSpriteAttributes,
  parseSpriteAttributesFromXml2js 
} from './xmlUtils';

// 示例1: 使用原生DOM解析
export const exampleDomParsing = () => {
  // 假设我们有一个XML元素
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
  
  // 使用健壮的属性解析
  const spriteData = parseSpriteAttributes(spriteElement);
  
  console.log('Parsed sprite data:', spriteData);
  // 输出:
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

// 示例2: 使用xml2js解析
export const exampleXml2jsParsing = () => {
  // 模拟xml2js解析后的对象
  const xml2jsResult = {
    sprite: {
      $: {
        name: "Pirate Uniform 2 Right Lower Arm",
        texture: "pirate_2.png",
        limb: "RightArm",
        hidelimb: "false",
        inheritsourcerect: "true",
        SourceRect: "272,0,64,92.5",  // 注意这里是大写的SourceRect
        Origin: "0.5,0.518919"        // 注意这里是大写的Origin
      }
    }
  };
  
  // 使用健壮的属性解析
  const spriteData = parseSpriteAttributesFromXml2js(xml2jsResult.sprite);
  
  console.log('Parsed sprite data from xml2js:', spriteData);
  // 输出相同的结果，即使XML中使用了大写属性名
};

// 示例3: 手动使用单个解析函数
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
  
  // 手动解析各个属性
  const id = getAttribute(limbElement, 'id', '');
  const name = getAttribute(limbElement, 'name', '');  // 会自动找到Name属性
  const type = getAttribute(limbElement, 'type', '');  // 会自动找到Type属性
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

// 示例4: 处理各种大小写变体
export const exampleCaseVariants = () => {
  const testCases = [
    // 原始DOM元素
    { element: createTestElement('sourcerect', '100,200,300,400') },
    { element: createTestElement('SourceRect', '100,200,300,400') },
    { element: createTestElement('sourceRect', '100,200,300,400') },
    { element: createTestElement('SOURCERECT', '100,200,300,400') },
    
    // xml2js对象
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
    // 所有测试用例都应该输出: [100, 200, 300, 400]
  });
};

// 辅助函数
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

// 导出示例函数
export const runAllExamples = () => {
  console.log('=== XML解析工具示例 ===');
  
  console.log('\n1. DOM解析示例:');
  exampleDomParsing();
  
  console.log('\n2. xml2js解析示例:');
  exampleXml2jsParsing();
  
  console.log('\n3. 手动解析示例:');
  exampleManualParsing();
  
  console.log('\n4. 大小写变体测试:');
  exampleCaseVariants();
}; 