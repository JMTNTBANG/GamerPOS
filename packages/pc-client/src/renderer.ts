let StationID = 'unknown'

// @ts-ignore
window.electronAPI.onSetStationId((values) => {
    StationID = values.StationID;
    const stationIdElement = document.getElementById("stationId") as HTMLHeadingElement
    stationIdElement.innerText = `Station ID: ${StationID}`
    connectToServer(values.ServerIP);
});
window.onload = () => {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key.length > 1 && !event.ctrlKey && !event.altKey && !event.metaKey) event.preventDefault();
        if (event.key === 'F10') {
            const overrideModal = document.getElementById("override-login") as HTMLDivElement;
            if (overrideModal.style.display === 'none') {
                overrideModal.style.display = "flex"
                const passwordInput = document.getElementById("password") as HTMLInputElement;
                passwordInput.focus();
            } else if (overrideModal.style.display === 'flex') {
                overrideModal.style.display = "none"
            }
        } else if (event.key === 'Escape') {
            const overrideModal = document.getElementById("override-login") as HTMLDivElement;
            overrideModal.style.display = "none"

        }
    })
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    passwordInput.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (passwordInput.value === 'password') {
                // @ts-ignore
                window.electronAPI.hideLockScreen()
                passwordInput.value = '';
                // @ts-ignore
                window.electronAPI.debugTrayIcon()
                const overrideModal = document.getElementById("override-login") as HTMLDivElement;
                overrideModal.style.display = "none"
            }
        }
    })
}

function connectToServer(ip: string) {
    const ws = new WebSocket(`ws://${ip}:49152`)
    ws.onopen = () => {
        console.log("Connected to server")
        ws.send(JSON.stringify({type: "identify", StationID: StationID}))
        // @ts-ignore
        window.electronAPI.onTrayIcon((type: string) => {
            switch (type) {
                case "ra":
                    ws.send(JSON.stringify({type: "assistance", StationID: StationID}))
                    break;
            }
        })
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
        setTimeout(() => connectToServer(ip), 1000)
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