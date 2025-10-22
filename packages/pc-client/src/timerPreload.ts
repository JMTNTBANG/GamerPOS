const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onSetTime: (callback: Function) => {
        ipcRenderer.on('set-time', (event: any, timeString: string) => callback(timeString));
    }
});
