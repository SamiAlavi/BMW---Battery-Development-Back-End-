const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const dbPath = process.env.DB_NAME;
const scriptDir = 'scripts'
const scriptPath = path.join(scriptDir, 'schema.sql');
const csvDataPath = 'csv_data'

const db = new sqlite3.Database(dbPath);

const csvMatchPattern = /^Generic_(\d+)_/

const sql_CSV_Data = "INSERT INTO CSV_Data (filename, timestamp) VALUES (?, ?)"
const sql_Capacity = "INSERT INTO Capacity (file_id, cycle_number, capacity) VALUES "
const sql_Cycle = "INSERT INTO Cycle (file_id, cycle_number, time, current, voltage) VALUES "

const BATCH_SIZE = 6000

function initDB() {
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');

    // Execute the SQL script
    db.serialize(() => {
        db.exec(sqlScript, async function(err) {
            if (err) {
                console.error('Error executing script:', err);
            } else {
                console.log('Schema Script executed successfully');
                csvFilesGrouped = groupCsvFilesByPrefix(csvDataPath)
                await readCsvFiles(csvFilesGrouped)
            }
            // Close the database connection
            db.close();
        });
    });    
}

function groupCsvFilesByPrefix(directory) {
    const csvFilesGrouped = {};
    const files = fs.readdirSync(directory);

    files.forEach(filename => {
        if (filename.endsWith('.csv')) {
            const match = filename.match(csvMatchPattern); // Match pattern
            if (match && match.length > 1) {
                const prefix = match[0]
                if (!csvFilesGrouped[prefix]) {
                    csvFilesGrouped[prefix] = [];
                }
                csvFilesGrouped[prefix].push(filename);
            }
        }
    });
    return csvFilesGrouped;
}

async function readCsvFiles(csvFilesGrouped) {
    for (const group in csvFilesGrouped) {
        for (let filename of csvFilesGrouped[group]) {
            const csvDataID = await insertData(sql_CSV_Data, [filename, Date.now()])
            await readCsvFile(filename)
                .then(async rows => {
                    await insertCSVData(csvDataID, filename, rows)
                    console.log(`Data Loaded: ${filename}`);
                })
                .catch(error => {
                    console.error('Error reading CSV file:', error);
                });
        }
    }
}

function readCsvFile(filename) {
    const filepath = path.join(csvDataPath, filename)
    return new Promise((resolve, reject) => {
        const rows = [];
        fs.createReadStream(filepath)
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', () => {
                resolve(rows);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function insertCSVData(csvDataID, filename, rows) {
    if (filename.includes("capacity_data")) {
        for (let i=0; i<rows.length; i+=BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '(?,?,?)').join(',');
            const values = batch.flatMap(row => {
                const cycle_number = parseInt(row.cycle_number)
                const capacity = parseFloat(row.capacity)
                return [csvDataID, cycle_number, capacity]
            });
            const sql = `${sql_Capacity}${placeholders}`
            await insertData(sql, values)
        }
    }
    else if (filename.includes("cycle_data")) {
        for (let i=0; i<rows.length; i+=BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const placeholders = batch.map(() => '(?,?,?,?,?)').join(',');
            const values = batch.flatMap(row => {
                const cycle_number = parseInt(row.cycle_number)
                const time = parseInt(row.time)
                const current = parseFloat(row.current)
                const voltage = parseFloat(row.voltage)
                return [csvDataID, cycle_number, time, current, voltage]
            });
            const sql = `${sql_Cycle}${placeholders}`
            await insertData(sql, values)  
        }      
    }
}

function insertData(sql, values) {
    return new Promise((resolve, reject) => {
        db.run(sql, values, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve(this.lastID); // Return the last inserted row ID
            }
        });
    });
}


initDB()