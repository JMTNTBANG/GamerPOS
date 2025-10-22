let StationID = 'unknown'

// @ts-ignore
window.electronAPI.onSetStationId((values) => {
    StationID = values.StationID;
    const stationIdElement = document.getElementById("stationId") as HTMLHeadingElement
    stationIdElement.innerText = `Station ID: ${StationID}`
    connectToServer(values.ServerIP);
});

function connectToServer(ip: string) {
    const ws = new WebSocket(`ws://${ip}:49152`)
    ws.onopen = () => {
        console.log("Connected to server")
        ws.send(JSON.stringify({type: "identify", StationID: StationID}))
    }
    ws.onmessage = (e) => {
        const message = JSON.parse(e.data)
        switch (message.type) {
            case "unlock":
                // @ts-ignore
                window.electronAPI.hideLockScreen()
                // @ts-ignore
                window.electronAPI.setOverlayVisibility(true);
                if (message.duration && message.duration > 0) {
                    setTimer(message.duration);
                }
                break;
            case "lock":
                // @ts-ignore
                window.electronAPI.showLockScreen()
                // @ts-ignore
                window.electronAPI.setOverlayVisibility(false);
                if (timerInterval) {
                    clearInterval(timerInterval);
                }
                // @ts-ignore
                window.electronAPI.setTimer("--:--:--");
                break;
        }
    }
    ws.onclose = (e) => {
        console.log("Disconnected from server")
        setTimeout(connectToServer, 1000)
    }
    ws.onerror = (error) => {
        console.error(error)
    }
}

let timerInterval: NodeJS.Timeout | null = null;

function setTimer(duration: number) {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    let remainingTime = duration
    timerInterval = setInterval(() => {
        remainingTime += -1000
        if (timerInterval && remainingTime <= 0) {
            clearInterval(timerInterval);
            // @ts-ignore
            window.electronAPI.setTimer("--:--:--");
            return;
        }
        const totalSeconds = Math.floor(remainingTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formattedTime = [
            String(hours).padStart(2, '0'),
            String(minutes).padStart(2, '0'),
            String(seconds).padStart(2, '0')
        ].join(':');
        // @ts-ignore
        window.electronAPI.setTimer(formattedTime);
    }, 1000)
}