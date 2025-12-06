import {app, BrowserWindow, dialog, ipcMain, shell} from 'electron'
import {hostname} from "node:os";

let serverIP = ""
let IPDefined = false

for (let arg of process.argv) {
    if (arg.startsWith('-ip=')) {
        const definedIP = arg.substring(4)
        if (definedIP !== "") {
            IPDefined = true
            serverIP = definedIP
        }
    }
}

if (!IPDefined) {
    dialog.showErrorBox("No IP", "Please Define an IP using \"-ip=\"")
    process.exit(1)
}

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({ icon: __dirname + '/assets/app-icon.ico', webPreferences: { preload: `${__dirname}/preload.js`, nodeIntegration: true }})
    mainWindow.setMenuBarVisibility(false)
    mainWindow.loadFile('./src/index.html');
    mainWindow.maximize()
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.send('server-info', {ip: serverIP, hostname: hostname()});
    });
})

ipcMain.on('beep', (event: any) => {
    shell.beep()
})

ipcMain.on('show-error-box', (event: any, content: { title: string, message: string }) => {
    dialog.showErrorBox(content.title, content.message)
})

// Modals
ipcMain.on('show-modal', (event: any, modal: string, data: any = "") => {
    if (!mainWindow || !modal) return {error: "Invalid Modal"};
    let width = 0
    let height = 0
    let filePath = ""
    let closable = true
    switch (modal) {
        case 'login':
            height = 175
            width = 300
            filePath = "./src/login.html"
            closable = false
            break
        case 'sessionDuration':
            height = 175
            width = 300
            filePath = "./src/sessionDuration.html"
            break
        case 'customerSelect':
            height = 500
            width = 500
            filePath = "./src/customerSelect.html"
            break
    }
    const child = new BrowserWindow({icon: __dirname + '/assets/app-icon.ico', parent: mainWindow, modal: true, show: false, width: width, height: height, closable: closable, resizable: false, minimizable: false, maximizable: false, webPreferences: { preload: `${__dirname}/preload.js`, nodeIntegration: true }})
    if (!closable) {
        child.on('close', (event: any) => {
            event.preventDefault();
        });
    }
    child.setMenuBarVisibility(false)
    child.loadFile(filePath)
    child.once('ready-to-show', () => {
        child.show()
        child.webContents.send('modal-preload-data', data)
    })
    const modalCallback = (event: any, srcModal: string, data: any) => {
        if (srcModal === modal) mainWindow?.webContents.send('modal-callback', srcModal, data)
        child.destroy()
        ipcMain.removeListener('modal-data', modalCallback)
    }
    ipcMain.on('modal-data', modalCallback)
})