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

function initDB() {
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');

    // Execute the SQL script
    db.serialize(() => {
        db.exec(sqlScript, function(err) {
            if (err) {
                console.error('Error executing script:', err);
            } else {
                console.log('Script executed successfully');
                csvFilesGrouped = groupCsvFilesByPrefix(csvDataPath)
                readCsvFiles(csvFilesGrouped)
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
                filepath = path.join(directory, filename)
                csvFilesGrouped[prefix].push(filepath);
            }
        }
    });
    return csvFilesGrouped;
}

function readCsvFiles(csvFilesGrouped) {
    for (const group in csvFilesGrouped) {
        csvFilesGrouped[group].forEach(async filepath => {
            const filename = path.basename(filepath);
            const csvDataID = await insertData(sql_CSV_Data, [filename, Date.now()])
            console.log(`${filename}: ${csvDataID}`)
            readCsvFile(filepath)
                .then(rows => {
                    console.log(`CSV file contents: ${rows.length} rows`);
                    if (filename.includes("capacity_data")) {
        
                    }
                    else if (filename.includes("cycle_data")) {
        
                    }
                })
                .catch(error => {
                    console.error('Error reading CSV file:', error);
                });
        });
    }
}

function readCsvFile(filepath) {
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