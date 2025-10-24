type StationStatus = "vacant" | "occupied" | "cleaning"
class Station {
    hostname: string;
    needsAttention: boolean = false
    session: number | null = null;
    socket: WebSocket;
    status: StationStatus;
    constructor(hostname: string, socket: WebSocket, stationStatus: StationStatus) {
        this.hostname = hostname;
        this.socket = socket;
        this.status = stationStatus;
    }
}
let hostname: string | null = null;

let getStationForDurationDefinition = (callback: Function) => {}

// @ts-ignore
window.electronAPI.onServerInfo((value) => {
    connectToServer(value!.ip);
    hostname = value!.hostname;
})

window.onload = () => {
    const passwordBox = document.getElementById('password') as HTMLInputElement;
    passwordBox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (passwordBox.value === 'password') {
                passwordBox.value = '';
                const loginWindow = document.getElementById('login') as HTMLDivElement;
                loginWindow.style.display = 'none';
            }
        }
    })

    const tabButtons = document.getElementsByClassName('tabButton') as HTMLCollectionOf<HTMLButtonElement>
    const tabs = document.getElementsByClassName('tab') as HTMLCollectionOf<HTMLDivElement>
    function enableAllButtons () {
        for (let i = 0; i < tabButtons.length; i++) {
            tabButtons.item(i)!.classList.remove('active');
            tabButtons.item(i)!.disabled = false;
        }
    }
    function hideAllTabs() {
        for (let i = 0; i < tabs.length; i++) {
            tabs.item(i)!.style.display = 'none';
        }
    }
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].addEventListener('click', (e) => {
            e.preventDefault();
            enableAllButtons();
            tabButtons.item(i)!.classList.add('active');
            tabButtons.item(i)!.disabled = true;
            hideAllTabs();
            const tab = document.getElementById(tabButtons.item(i)!.id.slice(0, -6) + "Tab")
            tab!.style.display = 'block';
        })
    }
    const duration = document.getElementById("sessionDuration") as HTMLInputElement
    duration?.addEventListener("keydown", (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            getStationForDurationDefinition((ws: WebSocket, station: Station, sdModal: HTMLDivElement) => {
                ws.send(JSON.stringify({type: "status-update", hostname: station.hostname, duration: parseInt(duration.value) * 60000}))
                sdModal!.style.display = "none";
                getStationForDurationDefinition = (callback: Function) => {}
            })
        }
    })
}

const attentionClock = setInterval(() => {
    const attention = document.getElementsByClassName("attention")
    for (let i = 0; i < attention.length; i++) {
        const element = attention[i] as HTMLButtonElement;
        // @ts-ignore
        window.electronAPI.beep()
        element.classList.toggle("attention")
        setTimeout(() => {
            element.classList.toggle("attention")
        }, 500)
    }
},1000)

function connectToServer(ip: string) {
    const ws = new WebSocket(`ws://${ip}:49152`);
    ws.onopen = () => {
        console.log('Connected to server')
        document.getElementById("loadScreen")!.style.display = 'none';
        ws.send(JSON.stringify({type: "identify-pos", hostname: hostname}))
    }
    ws.onmessage = (e) => {
        const message = JSON.parse(e.data);
        switch (message.type) {
            case "station-info":
                const stations = new Map<string, Station>(Object.entries(message.stations))
                const stationsTab = document.getElementById("stationsTab") as HTMLDivElement;
                stationsTab.innerHTML = ""
                stations.forEach((station: Station) => {
                    const button = document.createElement("button");
                    button.classList.add('stationButton', station.status);
                    if (station.needsAttention) button.classList.add('attention');
                    button.addEventListener("click", (e) => {
                        if (station.status === "vacant") {
                            e.preventDefault()
                            const sdModal = document.getElementById("sessionDurationModal") as HTMLDivElement
                            sdModal!.style.display = "flex";
                            getStationForDurationDefinition = (callback: Function) => callback(ws, station, sdModal);
                        } else {
                            ws.send(JSON.stringify({type: "status-update", hostname: station.hostname}))
                        }

                    })
                    button.id = station.hostname
                    button.innerText = station.hostname;
                    stationsTab.appendChild(button);
                })
                break;
        }
    }
    ws.onclose = (e) => {
        console.log("Disconnected from server");
        setTimeout(() => connectToServer(ip), 1000)
        document.getElementById("loadScreen")!.style.display = 'flex';
    }
    ws.onerror = (error) => {
        console.error(error)
    }
}