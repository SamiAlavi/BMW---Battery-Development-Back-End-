import express from 'express';
import csv from 'csv-parser';
import multer from 'multer';
import fs from 'fs';
import {databaseService} from './services/databaseservice';
require('dotenv').config();

const app = express();

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

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
        // const placeholders = fileRows[0] ? '(' + Object.keys(fileRows[0]).map(_ => '?').join(', ') + ')' : null;
        // if (!placeholders) {
        //   res.status(400).send('Empty CSV file');
        //   return;
        // }
  
        // const columns = Object.keys(fileRows[0]);
        // const values = fileRows.map(row => columns.map(col => row[col]));
  
        // const sql = `INSERT INTO your_table_name (${columns.join(', ')}) VALUES ${placeholders}`;
        // db.serialize(() => {
        //   db.run('BEGIN TRANSACTION');
        //   values.forEach(row => {
        //     db.run(sql, row, (err) => {
        //       if (err) {
        //         console.error('Error inserting data into table:', err);
        //         res.status(500).send('Error inserting data into table');
        //         return;
        //       }
        //     });
        //   });
        //   db.run('COMMIT', (err) => {
        //     if (err) {
        //       console.error('Error committing transaction:', err);
        //       res.status(500).send('Error inserting data into table');
        //       return;
        //     }
        //     console.log('Data inserted successfully');
        //     res.send('File uploaded and data inserted into SQLite table successfully');
        //   });
        // });
      });
});

app.get('/csv_data', async (req, res) => {
  try {
      const query = 'SELECT * FROM CSV_Data';
      const rows = await databaseService.query(query);
      res.json(rows);
  } catch (error: any) {
      console.error('Error executing query:', error?.message);
      res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = parseInt(process.env.PORT ?? "5000");
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
