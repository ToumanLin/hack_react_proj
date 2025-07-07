const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 读取文本文件内容
  readFile: async (filePath) => {
    try {
      const fullPath = path.join(__dirname, 'assets', filePath);
      const content = await fs.promises.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },
  
  // 读取二进制文件内容（用于图片等）
  readFileAsBuffer: async (filePath) => {
    try {
      const fullPath = path.join(__dirname, 'assets', filePath);
      const buffer = await fs.promises.readFile(fullPath);
      return Array.from(buffer); // Convert to array for transfer
    } catch (error) {
      console.error('Error reading file as buffer:', error);
      throw error;
    }
  },
  
  // 检查文件是否存在
  fileExists: async (filePath) => {
    try {
      const fullPath = path.join(__dirname, 'assets', filePath);
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  },
  
  // 获取资源路径
  getAssetsPath: () => {
    return path.join(__dirname, 'assets');
  }
}); 