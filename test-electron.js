// 快速测试 Electron 环境检测和路径处理
const { app, BrowserWindow } = require('electron');
const path = require('path');

// 模拟环境变量
process.env.NODE_ENV = 'production';

function createTestWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'public', 'preload.js')
    }
  });

  // 加载一个简单的测试页面
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Electron Test</title>
</head>
<body>
    <h1>Electron Environment Test</h1>
    <div id="results"></div>
    <script>
        const results = document.getElementById('results');
        
        // 测试环境检测
        const isElectron = window && window.electronAPI;
        const isProduction = window.location.protocol === 'file:' || window.location.href.includes('file://');
        
        results.innerHTML += '<p>isElectron: ' + isElectron + '</p>';
        results.innerHTML += '<p>isProduction: ' + isProduction + '</p>';
        results.innerHTML += '<p>protocol: ' + window.location.protocol + '</p>';
        results.innerHTML += '<p>href: ' + window.location.href + '</p>';
        
        // 测试 Electron API
        if (window.electronAPI) {
            results.innerHTML += '<p>Electron API available: true</p>';
            
            // 测试文件读取
            window.electronAPI.readFile('filelist.xml')
                .then(content => {
                    results.innerHTML += '<p>File read success: ' + (content.length > 0) + '</p>';
                    results.innerHTML += '<p>Content length: ' + content.length + '</p>';
                })
                .catch(error => {
                    results.innerHTML += '<p>File read error: ' + error.message + '</p>';
                });
        } else {
            results.innerHTML += '<p>Electron API available: false</p>';
        }
    </script>
</body>
</html>`;

  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(testHtml));
  
  // 打开开发者工具
  mainWindow.webContents.openDevTools();
}

app.whenReady().then(createTestWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createTestWindow();
  }
}); 