DROP TABLE IF EXISTS Cycle;
DROP TABLE IF EXISTS Capacity;
DROP TABLE IF EXISTS CSV_Data;

CREATE TABLE IF NOT EXISTS CSV_Data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT,
    type TEXT,
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
    file_id INTEGER,
    cycle_number INTEGER,
    time INTEGER,
    current REAL,
    voltage REAL,
    FOREIGN KEY (file_id) REFERENCES CSV_Data(id)
);