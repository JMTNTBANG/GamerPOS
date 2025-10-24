import {app, BrowserWindow, ipcMain, shell} from 'electron'
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
    process.exit("Please Define an IP using \"-ip=\"")
}

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({webPreferences: { preload: `${__dirname}/preload.js`, nodeIntegration: true }})
    mainWindow.loadFile('./src/index.html');
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow?.webContents.send('server-info', {ip: serverIP, hostname: hostname()});
    });
})

ipcMain.on('beep', (event: any) => {
    shell.beep()
})