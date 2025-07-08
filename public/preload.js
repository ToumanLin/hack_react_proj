const { contextBridge, ipcRenderer } = require('electron');

// 暴露一个安全的、经过筛选的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 将文件读取请求发送到主进程
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  
  // 将二进制文件读取请求发送到主进程
  readFileAsBuffer: (filePath) => ipcRenderer.invoke('read-file-as-buffer', filePath),
  
  // 请求主进程提供资源的基础路径
  getAssetsPath: () => ipcRenderer.invoke('get-assets-path')
}); 