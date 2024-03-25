CREATE TABLE IF NOT EXISTS CSV_Data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    timestamp TEXT
);

CREATE TABLE IF NOT EXISTS Capacity (
    cycle_number INTEGER PRIMARY KEY,
    capacity REAL,
    file_id INTEGER REFERENCES CSV_Data(id)
);

CREATE TABLE IF NOT EXISTS Cycle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_number INTEGER REFERENCES Capacity(cycle_number),
    time TEXT,
    current REAL,
    voltage REAL
);
