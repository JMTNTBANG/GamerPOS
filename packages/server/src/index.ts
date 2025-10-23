import express from 'express'
import * as http from "node:http";
import {WebSocketServer} from "ws";
import {Station} from "../../shared/src/types"

// Initialize Server
const app = express()
app.use(express.json())
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Database
const stations = new Map<string, Station>

// PC Client Communication
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            if (typeof message.toString() == "string") {
                const data = JSON.parse(message.toString());
                switch (data.type) {
                    case "identify":
                        stations.set(data.StationID, new Station(data.StationID, ws, "vacant"))
                        console.log("Station", data.StationID, "Connected")
                        ws.on('close', () => {
                            stations.delete(data.StationID)
                            console.log('Station', data.StationID, "Disconnected");
                        })
                        break;
                    case "assistance":
                        console.log("Station", data.StationID, "Needs Assistance")
                }
            } else {
                console.error("Not a JSON received.")
            }
        } catch (e) {
            console.error(e)
        }

    })
})

// POS Client Communication
app.post('/api/sessions/unlock', (req, res) => {
    const { StationID, duration } = req.body
    const station = stations.get(StationID)
    // Check if Station Exists
    if (!station) {
        res.status(404).send("Station Not Found")
        return;
    }
    // Check if Station is already Unlocked
    if (station.status !== "vacant") {
        res.status(423).send("Station Currently In Use");
        return;
    }
    station.socket.send(JSON.stringify({ type: "unlock", duration: duration}));
    station.session = duration;
    station.status = "occupied"
    if (duration > 0) {
        setTimeout(() => {
            station.socket.send(JSON.stringify({ type: "lock" }))
            station.session = null
            station.status = "cleaning"
            stations.set(StationID, station);
        }, duration);
    }
    res.sendStatus(200)
    stations.set(StationID, station);
})
app.post('/api/sessions/lock', (req, res) => {
    const { StationID } = req.body
    const station = stations.get(StationID)
    // Check if Station Exists
    if (!station) {
        res.status(404).send("Station Not Found")
        return;
    }
    // Check if Station is already Locked
    if (station.status === "vacant") {
        res.status(423).send("Station Currently Locked");
        return;
    }
    station.socket.send(JSON.stringify({ type: "lock" }))
    station.session = null
    if (station.status === "occupied") {
        station.status = "cleaning"
    } else {
        station.status = "vacant"
    }
    res.sendStatus(200)
    stations.set(StationID, station);
})


server.listen(49152);