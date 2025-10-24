import express from 'express'
import * as http from "node:http";
import {WebSocketServer} from "ws";
import {POS, Station} from "../../shared/src/types"

// Initialize Server
const app = express()
app.use(express.json())
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Database
const poss = new Map<string, POS>
const stations = new Map<string, Station>

function updatePOSs() {
    poss.forEach((pos) => {
        pos.socket.send(JSON.stringify({ type: "station-info", stations: Object.fromEntries(stations) }))
    })
}

// PC Client Communication
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            if (typeof message.toString() == "string") {
                const data = JSON.parse(message.toString());
                switch (data.type) {
                    case "identify-pc":
                        stations.set(data.hostname, new Station(data.hostname, ws, "vacant"))
                        console.log("Station", `"${data.hostname}"`, "Connected")
                        updatePOSs()
                        ws.on('close', () => {
                            stations.delete(data.hostname)
                            console.log('Station', `"${data.hostname}"`, "Disconnected");
                            updatePOSs()
                        })
                        break;
                    case "identify-pos":
                        poss.set(data.hostname, new POS(data.hostname, ws))
                        console.log("POS", `"${data.hostname}"`, "Connected")
                        updatePOSs()
                        ws.on('close', () => {
                            poss.delete(data.hostname)
                            console.log('POS', `"${data.hostname}"`, "Disconnected")
                            updatePOSs()
                        })
                        break;
                    case "assistance":
                        console.log("Station", `"${data.hostname}"`, "Needs Assistance")
                        const station1 = stations.get(data.hostname)
                        station1!.needsAttention = true
                        stations.set(data.hostname, station1!)
                        updatePOSs()
                        break;
                    case "status-update":
                        const station2 = stations.get(data.hostname)
                        if (station2?.needsAttention) {
                            station2!.needsAttention = false
                            stations.set(data.hostname, station2!)
                        } else {
                            switch (station2?.status) {
                                case "vacant":
                                    station2.socket.send(JSON.stringify({ type: "unlock", duration: data.duration}));
                                    station2.session = data.duration;
                                    station2.status = "occupied"
                                    if (data.duration > 0) {
                                        setTimeout(() => {
                                            station2.socket.send(JSON.stringify({ type: "lock" }))
                                            station2.session = null
                                            station2.status = "cleaning"
                                            stations.set(station2.hostname, station2);
                                            updatePOSs()
                                        }, data.duration);
                                    }
                                    stations.set(station2.hostname, station2);
                                    break;
                                case "occupied":
                                    station2.socket.send(JSON.stringify({ type: "lock" }))
                                    station2.session = null
                                    station2.status = "cleaning"
                                    stations.set(station2.hostname, station2);
                                    break;
                                case "cleaning":
                                    station2!.status = "vacant"
                                    break;
                            }
                        }
                        updatePOSs()
                        break;
                }
            } else {
                console.error("Not a JSON received.")
            }
        } catch (e) {
            console.error(e)
        }

    })
})

server.listen(49152);