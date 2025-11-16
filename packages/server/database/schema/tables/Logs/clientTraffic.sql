CREATE TABLE ClientTraffic (
    Hostname VARCHAR(15) NOT NULL,
    ClientType INT NOT NULL,
    TrafficType INT NOT NULL,
    DateLogged DATETIME DEFAULT CURRENT_TIMESTAMP
)