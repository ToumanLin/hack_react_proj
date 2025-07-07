const { app, BrowserWindow } = require('electron');
const path = require('path');

async function createWindow() {
  // 动态导入 electron-is-dev
  const isDev = (await import('electron-is-dev')).default;
  
  // 创建浏览器窗口
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    // icon: path.join(__dirname, 'favicon.ico') // 可选：设置应用图标
  });

  // 加载应用
  if (isDev) {
    // 开发环境：加载本地开发服务器
    mainWindow.loadURL('http://localhost:3000');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
    
    // 为生产环境设置协议处理，确保静态资源可以正确访问
    const protocol = require('electron').protocol;
    protocol.registerFileProtocol('assets', (request, callback) => {
      const url = request.url.replace('assets://', '');
      const filePath = path.join(__dirname, 'assets', url);
      callback({ path: filePath });
    });
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', function () {
    // mainWindow = null;
  });
}

// 当Electron完成初始化时创建窗口
app.whenReady().then(createWindow);

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
}); 