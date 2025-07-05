/**
 * XML解析工具函数
 * 处理XML属性名大小写不一致的问题
 */

/**
 * 从元素中获取属性值，支持多种大小写变体
 * @param {Element} element - XML元素
 * @param {string} baseName - 基础属性名（小写）
 * @param {string} defaultValue - 默认值
 * @returns {string|null} 属性值
 */
export const getAttribute = (element, baseName, defaultValue = null) => {
  if (!element) return defaultValue;
  
  // 尝试多种大小写变体
  const variants = [
    baseName,                    // 原始名称
    baseName.toLowerCase(),      // 全小写
    baseName.toUpperCase(),      // 全大写
    baseName.charAt(0).toUpperCase() + baseName.slice(1), // 首字母大写
    baseName.charAt(0).toLowerCase() + baseName.slice(1), // 首字母小写
  ];
  
  // 对于复合词，也尝试驼峰命名
  if (baseName.includes('source') && baseName.includes('rect')) {
    variants.push('sourceRect', 'SourceRect', 'sourcerect', 'SourceRect');
  }
  if (baseName.includes('sheet') && baseName.includes('index')) {
    variants.push('sheetIndex', 'SheetIndex', 'sheetindex', 'SheetIndex');
  }
  if (baseName.includes('limb') && baseName.includes('anchor')) {
    variants.push('limbAnchor', 'LimbAnchor', 'limbanchor', 'LimbAnchor');
  }
  if (baseName === 'texture') {
    variants.push('Texture');
  }
  
  // 去重
  const uniqueVariants = [...new Set(variants)];
  
  for (const variant of uniqueVariants) {
    const value = element.getAttribute(variant);
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  
  return defaultValue;
};

/**
 * 从xml2js解析的对象中获取属性值，支持多种大小写变体
 * @param {Object} obj - xml2js解析的对象
 * @param {string} baseName - 基础属性名（小写）
 * @param {string} defaultValue - 默认值
 * @returns {string|null} 属性值
 */
export const getXml2jsAttribute = (obj, baseName, defaultValue = null) => {
  if (!obj || !obj.$) return defaultValue;
  
  // 尝试多种大小写变体
  const variants = [
    baseName,                    // 原始名称
    baseName.toLowerCase(),      // 全小写
    baseName.toUpperCase(),      // 全大写
    baseName.charAt(0).toUpperCase() + baseName.slice(1), // 首字母大写
    baseName.charAt(0).toLowerCase() + baseName.slice(1), // 首字母小写
  ];
  
  // 对于复合词，也尝试驼峰命名
  if (baseName.includes('source') && baseName.includes('rect')) {
    variants.push('sourceRect', 'SourceRect', 'sourcerect', 'SourceRect');
  }
  if (baseName.includes('sheet') && baseName.includes('index')) {
    variants.push('sheetIndex', 'SheetIndex', 'sheetindex', 'SheetIndex');
  }
  if (baseName.includes('limb') && baseName.includes('anchor')) {
    variants.push('limbAnchor', 'LimbAnchor', 'limbanchor', 'LimbAnchor');
  }
  // 对于texture属性，添加特殊处理
  if (baseName === 'texture') {
    variants.push('Texture', 'TEXTURE');
  }
  
  // 去重
  const uniqueVariants = [...new Set(variants)];
  
  for (const variant of uniqueVariants) {
    const value = obj.$[variant];
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  
  return defaultValue;
};

/**
 * 解析数值数组，支持小数和去除空白字符
 * @param {string} value - 逗号分隔的数值字符串
 * @param {Array} defaultValue - 默认值
 * @returns {Array<number>} 解析后的数值数组
 */
export const parseNumberArray = (value, defaultValue = []) => {
  if (!value) return defaultValue;
  
  try {
    return value.split(',').map(val => parseFloat(val.trim()));
  } catch (error) {
    console.warn('Failed to parse number array:', value, error);
    return defaultValue;
  }
};

/**
 * 解析布尔值，支持多种表示方式
 * @param {string} value - 布尔值字符串
 * @param {boolean} defaultValue - 默认值
 * @returns {boolean} 解析后的布尔值
 */
export const parseBoolean = (value, defaultValue = false) => {
  if (value === null || value === undefined) return defaultValue;
  
  const lowerValue = value.toLowerCase().trim();
  return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'True';
};

/**
 * 解析浮点数
 * @param {string} value - 数值字符串
 * @param {number} defaultValue - 默认值
 * @returns {number} 解析后的浮点数
 */
export const parseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * 从XML元素中解析sprite属性
 * @param {Element} spriteElement - sprite XML元素
 * @returns {Object} 解析后的sprite对象
 */
export const parseSpriteAttributes = (spriteElement) => {
  if (!spriteElement) return null;
  
  return {
    name: getAttribute(spriteElement, 'name', ''),
    texture: getAttribute(spriteElement, 'texture', ''),
    limb: getAttribute(spriteElement, 'limb', ''),
    hidelimb: parseBoolean(getAttribute(spriteElement, 'hidelimb', 'false')),
    depthLimb: getAttribute(spriteElement, 'depthlimb', null),
    inheritLimbDepth: parseBoolean(getAttribute(spriteElement, 'inheritlimbdepth', 'true')),
    depth: parseFloat(getAttribute(spriteElement, 'depth', null)),
    inheritTextureScale: parseBoolean(getAttribute(spriteElement, 'inherittexturescale', 'false')),
    scale: parseFloat(getAttribute(spriteElement, 'scale', '1.0')),
    inheritOrigin: parseBoolean(getAttribute(spriteElement, 'inheritorigin', 'false')),
    origin: parseNumberArray(getAttribute(spriteElement, 'origin', null)),
    inheritSourceRect: parseBoolean(getAttribute(spriteElement, 'inheritsourcerect', 'false')),
    sourceRect: parseNumberArray(getAttribute(spriteElement, 'sourcerect', null)),
    ignoreLimbScale: parseBoolean(getAttribute(spriteElement, 'ignorelimbscale', 'false')),
    inheritScale: parseBoolean(getAttribute(spriteElement, 'inheritscale', 'false')),
    hideOtherWearables: parseBoolean(getAttribute(spriteElement, 'hideotherwearables', 'false')),
    hideWearablesOfType: getAttribute(spriteElement, 'hidewearablesoftype', ''),
    rotation: parseFloat(getAttribute(spriteElement, 'rotation', '0')),
  };
};

/**
 * 从xml2js对象中解析sprite属性
 * @param {Object} spriteObj - xml2js解析的sprite对象
 * @returns {Object} 解析后的sprite对象
 */
export const parseSpriteAttributesFromXml2js = (spriteObj) => {
  if (!spriteObj || !spriteObj.$) return null;
  
  return {
    name: getXml2jsAttribute(spriteObj, 'name', ''),
    texture: getXml2jsAttribute(spriteObj, 'texture', ''),
    limb: getXml2jsAttribute(spriteObj, 'limb', ''),
    hidelimb: parseBoolean(getXml2jsAttribute(spriteObj, 'hidelimb', 'false')),
    depthLimb: getXml2jsAttribute(spriteObj, 'depthlimb', null),
    inheritLimbDepth: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritlimbdepth', 'true')),
    depth: parseFloat(getXml2jsAttribute(spriteObj, 'depth', null)),
    inheritTextureScale: parseBoolean(getXml2jsAttribute(spriteObj, 'inherittexturescale', 'false')),
    scale: parseFloat(getXml2jsAttribute(spriteObj, 'scale', '1.0')),
    inheritOrigin: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritorigin', 'false')),
    origin: parseNumberArray(getXml2jsAttribute(spriteObj, 'origin', null)),
    inheritSourceRect: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritsourcerect', 'false')),
    sourceRect: parseNumberArray(getXml2jsAttribute(spriteObj, 'sourcerect', null)),
    ignoreLimbScale: parseBoolean(getXml2jsAttribute(spriteObj, 'ignorelimbscale', 'false')),
    inheritScale: parseBoolean(getXml2jsAttribute(spriteObj, 'inheritscale', 'false')),
    hideOtherWearables: parseBoolean(getXml2jsAttribute(spriteObj, 'hideotherwearables', 'false')),
    hideWearablesOfType: getXml2jsAttribute(spriteObj, 'hidewearablesoftype', ''),
    rotation: parseFloat(getXml2jsAttribute(spriteObj, 'rotation', '0')),
  };
};

/**
 * 从XML元素中解析limb属性
 * @param {Element} limbElement - limb XML元素
 * @returns {Object} 解析后的limb对象
 */
export const parseLimbAttributes = (limbElement) => {
  if (!limbElement) return null;
  
  return {
    id: getAttribute(limbElement, 'id', ''),
    name: getAttribute(limbElement, 'name', ''),
    type: getAttribute(limbElement, 'type', ''),
    scale: parseFloat(getAttribute(limbElement, 'scale', '1')),
    depth: parseFloat(getAttribute(limbElement, 'depth', '0')),
    origin: parseNumberArray(getAttribute(limbElement, 'origin', '0.5,0.5')),
    sourceRect: parseNumberArray(getAttribute(limbElement, 'sourcerect', null)),
    texture: getAttribute(limbElement, 'texture', ''),
  };
};

/**
 * 从xml2js对象中解析limb属性
 * @param {Object} limbObj - xml2js解析的limb对象
 * @returns {Object} 解析后的limb对象
 */
export const parseLimbAttributesFromXml2js = (limbObj) => {
  if (!limbObj || !limbObj.$) return null;
  
  return {
    id: getXml2jsAttribute(limbObj, 'id', ''),
    name: getXml2jsAttribute(limbObj, 'name', ''),
    type: getXml2jsAttribute(limbObj, 'type', ''),
    scale: parseFloat(getXml2jsAttribute(limbObj, 'scale', '1')),
    depth: parseFloat(getXml2jsAttribute(limbObj, 'depth', '0')),
    origin: parseNumberArray(getXml2jsAttribute(limbObj, 'origin', '0.5,0.5')),
    sourceRect: parseNumberArray(getXml2jsAttribute(limbObj, 'sourcerect', null)),
    texture: getXml2jsAttribute(limbObj, 'texture', ''),
  };
};

/**
 * 从XML元素中解析joint属性
 * @param {Element} jointElement - joint XML元素
 * @returns {Object} 解析后的joint对象
 */
export const parseJointAttributes = (jointElement) => {
  if (!jointElement) return null;
  
  return {
    limb1: getAttribute(jointElement, 'limb1', ''),
    limb2: getAttribute(jointElement, 'limb2', ''),
    limb1Anchor: parseNumberArray(getAttribute(jointElement, 'limb1anchor', '0,0')),
    limb2Anchor: parseNumberArray(getAttribute(jointElement, 'limb2anchor', '0,0')),
  };
};

/**
 * 从xml2js对象中解析joint属性
 * @param {Object} jointObj - xml2js解析的joint对象
 * @returns {Object} 解析后的joint对象
 */
export const parseJointAttributesFromXml2js = (jointObj) => {
  if (!jointObj || !jointObj.$) return null;
  
  return {
    limb1: getXml2jsAttribute(jointObj, 'limb1', ''),
    limb2: getXml2jsAttribute(jointObj, 'limb2', ''),
    limb1Anchor: parseNumberArray(getXml2jsAttribute(jointObj, 'limb1anchor', '0,0')),
    limb2Anchor: parseNumberArray(getXml2jsAttribute(jointObj, 'limb2anchor', '0,0')),
  };
}; 