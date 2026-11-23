const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('news', {
  // Ticker
  onNews: cb => ipcRenderer.on('ticker:news', (_e, d) => cb(d)),
  onConfig: cb => ipcRenderer.on('ticker:config', (_e, d) => cb(d)),
  onChime: cb => ipcRenderer.on('ticker:chime', (_e, d) => cb(d)),
  ready: () => ipcRenderer.send('ticker:ready'),
  openLink: url => ipcRenderer.send('open:link', url),
  diag: msg => ipcRenderer.send('diag', String(msg).slice(0, 200)),
  diagInput: c => ipcRenderer.send('diag:input', c),
  openNotifySettings: () => ipcRenderer.send('open:notifySettings'),
  sendFeedback: () => ipcRenderer.send('open:feedback'),
  updatePanelDone: action => ipcRenderer.send('updpanel:done', action),
  onUpdatePanelLower: cb => ipcRenderer.on('updpanel:lower', () => cb()),
  openSettings: () => ipcRenderer.send('open:settings'),
  toggleCategory: cat => ipcRenderer.send('category:toggle', cat),
  popupAction: () => ipcRenderer.send('popup:action'),
  checkUpdate: () => ipcRenderer.send('update:check'),
  installUpdate: () => ipcRenderer.send('update:install'),
  getUpdateState: () => ipcRenderer.invoke('update:state'),
  onUpdateState: cb => ipcRenderer.on('update:state', (_e, d) => cb(d)),
  welcomeDone: choice => ipcRenderer.send('welcome:done', choice),
  getWelcomeData: () => ipcRenderer.invoke('welcome:data'),
  closePopup: () => ipcRenderer.send('popup:close'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  statusInfo: () => ipcRenderer.invoke('status:info'),
  statusAction: what => ipcRenderer.invoke('status:action', what),
  saveSettings: s => ipcRenderer.invoke('settings:save', s),
  testFeed: url => ipcRenderer.invoke('feed:test', url),
  demo: kind => ipcRenderer.invoke('demo:run', kind),
  testAlert: kind => ipcRenderer.invoke('alerts:test', kind),
  testTranslate: cfg => ipcRenderer.invoke('translate:test', cfg),
  refresh: () => ipcRenderer.send('news:refresh'),
  setActive: on => ipcRenderer.send('app:setActive', on),
  onSettingsChanged: cb => ipcRenderer.on('settings:changed', (_e, d) => cb(d)),
  onStatus: cb => ipcRenderer.on('settings:status', (_e, d) => cb(d))
});
