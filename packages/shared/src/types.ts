import {WebSocket} from "ws";

export type StationStatus = "vacant" | "occupied" | "cleaning"

export class Station {
    stationID: number;
    session: number | null = null;
    socket: WebSocket;
    status: StationStatus;
    constructor(stationID: number, socket: WebSocket, stationStatus: StationStatus) {
        this.stationID = stationID;
        this.socket = socket;
        this.status = stationStatus;
    }
}