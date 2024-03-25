CREATE TABLE IF NOT EXISTS CSV_Data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    timestamp TEXT
);

CREATE TABLE IF NOT EXISTS Capacity (
    file_id INTEGER,
    cycle_number INTEGER,
    capacity REAL,
    PRIMARY KEY (file_id, cycle_number),
    FOREIGN KEY (file_id) REFERENCES CSV_Data(id)
);


CREATE TABLE IF NOT EXISTS Cycle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_number INTEGER REFERENCES Capacity(cycle_number),
    time TEXT,
    current REAL,
    voltage REAL
);
