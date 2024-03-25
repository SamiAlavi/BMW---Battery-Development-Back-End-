import express from 'express';
import csv from 'csv-parser';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import fs from 'fs';
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PORT ?? "5000");

// Create or open the SQLite database
const sqlite3Verbose = sqlite3.verbose()
const dbPath = process.env.DB_NAME ?? "database.db";
const db = new sqlite3Verbose.Database(dbPath);

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

// Create a table (if not exists)
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS your_table_name (column1 TEXT, column2 TEXT)"); // Adjust column definitions accordingly
});

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// Endpoint for file upload
app.post('/upload', upload.single('file'), (req, res) => {
    // Check if file is provided
    if (!req.file || !req.file.buffer) {
      res.status(400).send('No file uploaded');
      return;
    }

    // File processing logic
    const fileRows: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => fileRows.push(data))
      .on('end', () => {
        // Insert data into SQLite table
        const placeholders = fileRows[0] ? '(' + Object.keys(fileRows[0]).map(_ => '?').join(', ') + ')' : null;
        if (!placeholders) {
          res.status(400).send('Empty CSV file');
          return;
        }
  
        const columns = Object.keys(fileRows[0]);
        const values = fileRows.map(row => columns.map(col => row[col]));
  
        const sql = `INSERT INTO your_table_name (${columns.join(', ')}) VALUES ${placeholders}`;
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          values.forEach(row => {
            db.run(sql, row, (err) => {
              if (err) {
                console.error('Error inserting data into table:', err);
                res.status(500).send('Error inserting data into table');
                return;
              }
            });
          });
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              res.status(500).send('Error inserting data into table');
              return;
            }
            console.log('Data inserted successfully');
            res.send('File uploaded and data inserted into SQLite table successfully');
          });
        });
      });
  });
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
