# XML解析工具使用指南

## 概述

这个XML解析工具库提供了健壮的XML属性解析功能，专门处理XML文件中属性名大小写不一致的问题。它支持多种大小写变体，并能正确处理包含小数的数值。

## 主要功能

### 1. 属性名大小写变体支持
- 自动尝试多种大小写变体：`sourcerect`, `SourceRect`, `sourceRect`, `SOURCERECT`
- 支持驼峰命名：`sourceRect`, `SourceRect`
- 支持首字母大写/小写：`Sourcerect`, `sourcerect`

### 2. 数值解析
- 正确处理包含小数的数值：`"272,0,64,92.5"`
- 自动去除空白字符
- 提供默认值支持

### 3. 类型转换
- 布尔值解析：支持 `"true"`, `"false"`, `"1"`, `"0"`, `"yes"`, `"no"`
- 浮点数解析：支持小数和科学计数法
- 数组解析：支持逗号分隔的数值数组

## 核心函数

### 基础属性获取

#### `getAttribute(element, baseName, defaultValue)`
从DOM元素中获取属性值，支持多种大小写变体。

```javascript
import { getAttribute } from './xmlUtils';

const element = document.querySelector('sprite');
const sourceRect = getAttribute(element, 'sourcerect', null);
// 会自动尝试: sourcerect, SourceRect, sourceRect, SOURCERECT 等
```

#### `getXml2jsAttribute(obj, baseName, defaultValue)`
从xml2js解析的对象中获取属性值。

```javascript
import { getXml2jsAttribute } from './xmlUtils';

const spriteObj = { $: { SourceRect: "272,0,64,92.5" } };
const sourceRect = getXml2jsAttribute(spriteObj, 'sourcerect', null);
// 会找到 SourceRect 属性
```

### 数值解析

#### `parseNumberArray(value, defaultValue)`
解析逗号分隔的数值数组，支持小数。

```javascript
import { parseNumberArray } from './xmlUtils';

const result = parseNumberArray("272,0,64,92.5");
// 返回: [272, 0, 64, 92.5]

const result2 = parseNumberArray("100, 200, 300, 400"); // 带空格
// 返回: [100, 200, 300, 400]
```

#### `parseFloat(value, defaultValue)`
解析浮点数，提供默认值支持。

```javascript
import { parseFloat } from './xmlUtils';

const result = parseFloat("0.518919", 0.5);
// 返回: 0.518919

const result2 = parseFloat(null, 1.0);
// 返回: 1.0 (默认值)
```

#### `parseBoolean(value, defaultValue)`
解析布尔值，支持多种表示方式。

```javascript
import { parseBoolean } from './xmlUtils';

parseBoolean("true");     // true
parseBoolean("false");    // false
parseBoolean("1");        // true
parseBoolean("0");        // false
parseBoolean("yes");      // true
parseBoolean("no");       // false
```

### 高级解析函数

#### `parseSpriteAttributes(spriteElement)`
从sprite XML元素中解析所有属性。

```javascript
import { parseSpriteAttributes } from './xmlUtils';

const spriteElement = document.querySelector('sprite');
const spriteData = parseSpriteAttributes(spriteElement);

// 返回完整的sprite对象，包含所有解析后的属性
console.log(spriteData);
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
```

#### `parseSpriteAttributesFromXml2js(spriteObj)`
从xml2js解析的sprite对象中解析所有属性。

```javascript
import { parseSpriteAttributesFromXml2js } from './xmlUtils';

const spriteObj = {
  $: {
    name: "Pirate Uniform 2 Right Lower Arm",
    texture: "pirate_2.png",
    limb: "RightArm",
    SourceRect: "272,0,64,92.5",  // 大写属性名
    Origin: "0.5,0.518919"        // 大写属性名
  }
};

const spriteData = parseSpriteAttributesFromXml2js(spriteObj);
// 返回相同的解析结果，即使XML中使用了大写属性名
```

## 使用示例

### 示例1: 解析服装XML

```javascript
import { parseSpriteAttributes } from './xmlUtils';

const parseClothingXML = async (xmlPath, selectedItemIdentifier) => {
  const response = await fetch(`/assets/${xmlPath}`);
  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  const itemElement = xmlDoc.querySelector(`Item[identifier="${selectedItemIdentifier}"]`);
  const wearableElement = itemElement.querySelector('Wearable');
  const spriteElements = wearableElement.querySelectorAll('sprite');
  
  const sprites = [];
  spriteElements.forEach(spriteElement => {
    // 使用健壮的解析工具
    const spriteData = parseSpriteAttributes(spriteElement);
    
    if (spriteData && spriteData.limb) {
      sprites.push(spriteData);
    }
  });
  
  return sprites;
};
```

### 示例2: 解析角色XML

```javascript
import { getXml2jsAttribute, parseNumberArray } from './xmlUtils';

const parseCharacterXML = async () => {
  const response = await fetch('/assets/Content/Characters/Human/Human.xml');
  const xmlText = await response.text();
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xmlText);
  
  const character = result.Character;
  const limbs = character.limb.map(limb => {
    const sprite = limb.sprite;
    
    // 使用健壮的属性解析
    const sourceRectStr = getXml2jsAttribute(sprite, 'sourcerect');
    const originStr = getXml2jsAttribute(sprite, 'origin');
    const depthStr = getXml2jsAttribute(sprite, 'depth');
    const textureStr = getXml2jsAttribute(sprite, 'texture');
    
    return {
      name: getXml2jsAttribute(limb, 'name'),
      sourceRect: parseNumberArray(sourceRectStr),
      origin: parseNumberArray(originStr, [0.5, 0.5]),
      depth: parseFloat(depthStr, 0),
      texture: textureStr
    };
  });
  
  return limbs;
};
```

## 支持的属性名变体

### 常用属性
- `sourcerect` / `SourceRect` / `sourceRect` / `SOURCERECT`
- `origin` / `Origin` / `ORIGIN`
- `texture` / `Texture` / `TEXTURE`
- `name` / `Name` / `NAME`
- `limb` / `Limb` / `LIMB`
- `scale` / `Scale` / `SCALE`
- `depth` / `Depth` / `DEPTH`

### 复合属性
- `sheetindex` / `SheetIndex` / `sheetIndex` / `SHEETINDEX`
- `limbanchor` / `LimbAnchor` / `limbAnchor` / `LIMBANCHOR`
- `inherittexturescale` / `InheritTextureScale` / `inheritTextureScale`
- `inheritsourcerect` / `InheritSourceRect` / `inheritSourceRect`

## 错误处理

所有解析函数都包含错误处理：

```javascript
// 如果解析失败，会返回默认值
const sourceRect = parseNumberArray("invalid,data", [0, 0, 100, 100]);
// 返回: [0, 0, 100, 100]

// 如果属性不存在，会返回默认值
const texture = getAttribute(element, 'texture', 'default.png');
// 如果找不到texture属性，返回: 'default.png'
```

## 性能考虑

- 属性名变体查找是线性的，但对于大多数XML文件来说性能影响很小
- 数值解析使用原生JavaScript函数，性能良好
- 建议在解析大量XML文件时使用缓存机制

## 迁移指南

### 从旧代码迁移

**旧代码:**
```javascript
const sourceRect = spriteElement.getAttribute('sourcerect');
const sourceRectArray = sourceRect.split(',').map(Number);
```

**新代码:**
```javascript
import { getAttribute, parseNumberArray } from './xmlUtils';

const sourceRect = getAttribute(spriteElement, 'sourcerect');
const sourceRectArray = parseNumberArray(sourceRect);
```

**旧代码:**
```javascript
const sourceRect = sprite.$.SourceRect || sprite.$.sourcerect;
const sourceRectArray = sourceRect.split(',').map(val => parseFloat(val.trim()));
```

**新代码:**
```javascript
import { getXml2jsAttribute, parseNumberArray } from './xmlUtils';

const sourceRect = getXml2jsAttribute(sprite, 'sourcerect');
const sourceRectArray = parseNumberArray(sourceRect);
```

## 测试

运行测试示例：

```javascript
import { runAllExamples } from './xmlUtilsExample';

runAllExamples();
```

这将运行所有示例并显示解析结果。 