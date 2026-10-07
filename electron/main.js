const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'Hangar 7 — Jet Engine Teardown',
    backgroundColor: '#0b1220',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  //electron-packager / dist build loads index.html; dev loads vite server
  const devURL = process.env.ELECTRON_START_URL;
  if (devURL) win.loadURL(devURL);
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
