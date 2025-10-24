import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    beep: () => ipcRenderer.send('beep'),
    onServerInfo: (callback: Function) => ipcRenderer.on('server-info', (event, value) => callback(value))
})