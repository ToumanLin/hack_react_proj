// 简单的环境检测测试
console.log('Testing environment detection...');

// 模拟浏览器环境
global.window = {
  location: {
    protocol: 'file:',
    href: 'file:///path/to/app'
  },
  electronAPI: {
    readFile: () => Promise.resolve('test content')
  }
};

// 直接测试环境检测逻辑
const isElectron = () => window && window.electronAPI;
const isProduction = () => window.location.protocol === 'file:' || window.location.href.includes('file://');
const isElectronProduction = () => isElectron() && isProduction();

console.log('isElectron():', isElectron());
console.log('isProduction():', isProduction());
console.log('isElectronProduction():', isElectronProduction());

// 测试路径转换逻辑
const convertTexturePath = (texturePath, gender) => {
  if (!texturePath) return '';
  
  let convertedPath = texturePath.replace(/\[gender\]/gi, gender);
  convertedPath = convertedPath.replace(/^%moddir(?::\d+)?%\//i, '');

  if (convertedPath.startsWith('Content/')) {
    if (isElectronProduction()) {
      convertedPath = convertedPath.replace('Content/', 'assets://Content/');
    } else {
      convertedPath = convertedPath.replace('Content/', '/assets/Content/');
    }
  }
  
  if (!convertedPath.startsWith('/assets/') && !convertedPath.startsWith('assets://') && convertedPath.includes('Content/')) {
    if (isElectronProduction()) {
      convertedPath = `assets://${convertedPath}`;
    } else {
      convertedPath = `/assets/${convertedPath}`;
    }
  }
  
  return convertedPath;
};

console.log('convertTexturePath test:');
console.log('Input: Content/Characters/Human/Human_female.png');
console.log('Output:', convertTexturePath('Content/Characters/Human/Human_female.png', 'female'));

console.log('Test completed!'); 