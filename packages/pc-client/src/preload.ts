import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    hideLockScreen: () => ipcRenderer.send('hide-lock-screen'),
    showLockScreen: () => ipcRenderer.send('show-lock-screen'),
    onSetStationId: (callback: Function) => ipcRenderer.on('set-station-id', (event, value) => callback(value)),
    setOverlayVisibility: (isVisible: boolean) => ipcRenderer.send('set-overlay-visibility', isVisible),
    setTimer: (timeString: string) => ipcRenderer.send('set-timer', timeString),
    debugTrayIcon: () => ipcRenderer.send('debug-tray-icon'),
    onTrayIcon: (callback: Function) => {ipcRenderer.on('on-tray-icon', (event, value) => callback(value))},
})