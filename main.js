const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 420,
    title: 'Sticky Tasks',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');

  // Raccourci global: nouvelle note
  app.whenReady().then(() => {
    const combo = process.platform === 'darwin' ? 'Command+N' : 'Control+N';
    globalShortcut.register(combo, () => win.webContents.send('create-new-note'));
  });

  // Menu minimal avec Always on Top
  const template = [
    {
      label: 'View',
      submenu: [
        {
          label: 'Always on Top',
          type: 'checkbox',
          click: (item) => win.setAlwaysOnTop(item.checked)
        },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'editMenu' },
    { role: 'windowMenu' }
  ];
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'services' }, { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }]
    });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
