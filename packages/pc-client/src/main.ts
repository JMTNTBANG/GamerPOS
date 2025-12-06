import {app, BrowserWindow, ipcMain, Menu, Tray} from 'electron'
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

let lockScreenWindow: BrowserWindow | null;
let timerWidget: BrowserWindow | null;
let trayIcon: Tray | null;

function createLockScreen() {
    lockScreenWindow = new BrowserWindow({ icon: __dirname + '/assets/app-icon.ico', fullscreen: true, frame: false, closable: false, webPreferences: { preload: `${__dirname}/preload.js`, nodeIntegration: true } });
    lockScreenWindow.setAlwaysOnTop(true, 'normal');
    lockScreenWindow.loadFile("./src/index.html")
    lockScreenWindow.webContents.on('did-finish-load', () => {
        lockScreenWindow?.webContents.send('server-info', {hostname: hostname(), ServerIP: serverIP});
    });
    lockScreenWindow.on('close', (event: any) => {
        event.preventDefault();
    });
}
function createTimerWidget() {
    timerWidget = new BrowserWindow({ width: 250, height: 80, transparent: true, frame: false, show: false, focusable: false, closable: false, webPreferences: { preload: `${__dirname}/timerPreload.js` } });
    timerWidget.setAlwaysOnTop(true, 'normal');
    timerWidget.setIgnoreMouseEvents(true);
    timerWidget.loadFile("./src/timerWidget.html")
    timerWidget.setPosition(10, 10);
    timerWidget.on('close', (event: any) => {
        event.preventDefault();
    });
}

function createTrayIcon() {
    trayIcon = new Tray(__dirname + '/assets/temp_icon.png')
    const contextMenu = Menu.buildFromTemplate([
        { label: "Request Assistance", type: 'normal' }
    ])
    contextMenu.items[0].click = (event: any) => {
        lockScreenWindow?.webContents.send('on-tray-icon', "ra")
    }
    trayIcon.setContextMenu(contextMenu)
}

app.whenReady().then(() => {
    createLockScreen()
    createTimerWidget()
    createTrayIcon()
})

ipcMain.on('hide-lock-screen', () => {
    lockScreenWindow?.hide()
})

ipcMain.on('show-lock-screen', () => {
    lockScreenWindow?.show()
})

ipcMain.on('set-overlay-visibility', (event: any, isVisible: boolean) => {
    if (isVisible) {
        timerWidget?.show();
    } else {
        timerWidget?.hide();
    }
});

ipcMain.on('set-timer', (event: any, timeString: string) => {
    timerWidget?.webContents.send('set-time', timeString);
});

ipcMain.on('debug-tray-icon', (event: any) => {
    const tray = new Tray(__dirname + '/assets/debug.png')
    const contextMenu = Menu.buildFromTemplate([
        { label: "Disable Override", type: 'normal' }
    ])
    contextMenu.items[0].click = (event: any) => {
        lockScreenWindow?.show()
        tray.destroy()
    }
    tray.setContextMenu(contextMenu)
})