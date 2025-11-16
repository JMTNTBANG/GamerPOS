import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    beep: () => ipcRenderer.send('beep'),
    onServerInfo: (callback: Function) => ipcRenderer.on('server-info', (event, value) => callback(value)),
    showErrorBox: (content: { title: string, message: string } ) => ipcRenderer.send('show-error-box', content),
    showModal: (modal: string) => ipcRenderer.send('show-modal', modal),
    modalData: (modal: string, data: object) => ipcRenderer.send('modal-data', modal, data),
    modalCallback: (modal: string, callback: Function) => ipcRenderer.on('modal-callback', (event, srcModal: string, data: any) => {
        if (srcModal === modal) callback(data)
    })
})