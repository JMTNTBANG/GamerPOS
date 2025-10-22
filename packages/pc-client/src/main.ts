import {app, BrowserWindow, ipcMain} from 'electron'

let stationID = ''
let stationDefined = false
let serverIP = ""
let IPDefined = false

for (let arg of process.argv) {
    if (arg.startsWith('-sid=')) {
        const definedStation = arg.substring(5)
        if (definedStation !== "") {
            stationDefined = true
            stationID = definedStation
        }
    } else if (arg.startsWith('-ip=')) {
        const definedIP = arg.substring(4)
        if (definedIP !== "") {
            IPDefined = true
            serverIP = definedIP
        }
    }
}
if (!stationDefined) {
    process.exit("Please Define a Station ID using \"-sid=\"")
}
if (!IPDefined) {
    process.exit("Please Define an IP using \"-ip=\"")
}

let lockScreenWindow: BrowserWindow | null;
let timerWidget: BrowserWindow | null;

function createLockScreen() {
    lockScreenWindow = new BrowserWindow({ fullscreen: true, frame: false, closable: false, webPreferences: { preload: `${__dirname}/preload.js`, nodeIntegration: true } });
    lockScreenWindow.setAlwaysOnTop(true, 'normal');
    lockScreenWindow.loadFile("./src/index.html")
    lockScreenWindow.webContents.on('did-finish-load', () => {
        lockScreenWindow?.webContents.send('set-station-id', {StationID: stationID, ServerIP: serverIP});
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

app.whenReady().then(() => {
    createLockScreen()
    createTimerWidget()
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