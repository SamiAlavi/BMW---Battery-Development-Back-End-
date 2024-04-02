import express from 'express';
import cors from 'cors';
import csv from 'csv-parser';
import multer from 'multer';
import fs from 'fs';
import bodyParser from 'body-parser';
import {databaseService} from './services/databaseservice';
require('dotenv').config();

const app = express();
app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for file upload
const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
    res.send('Hello, world!');
});


// Endpoint for file upload
app.post('/upload', upload.array('files'), (req, res) => {
    if (!req.files) {
      res.status(400).send('No file uploaded');
      return;
    }

    const files: Express.Multer.File[] = []
    if (Array.isArray(req.files)) {
      files.push(...req.files)
    }
    else if (typeof(req.files) === 'object') {
      const temp: {
        [fieldname: string]: Express.Multer.File[];
      } = req.files;
      Object.keys(temp).forEach((fieldname) => {
        files.push(...temp[fieldname])
      })
    }

    const type = req.body.type;


    for (let file of files) {
      // File processing logic
      const fileRows: any[] = [];
      const filepath = file.path;
      fs.createReadStream(filepath)
        .pipe(csv())
        .on('data', (data) => fileRows.push(data))
        .on('end', () => {
          // console.log(fileRows)
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

        fs.unlink(filepath, ()=>{})
    }

    res.send(`${files.length} files successfully uploaded`);
});

app.get('/csv_data', async (req, res) => {
  try {
      const query = 'SELECT * FROM CSV_Data';
      const rows = await databaseService.query(query);
      res.json(rows);
  } catch (error: any) {
      const errorMessage = `Internal server error: ${error?.message}`
      res.status(500).json({ error: errorMessage });
  }
});

app.get('/capacity/:file_id', async (req, res) => {
  const { file_id } = req.params;

  try {
      const query = `
          SELECT cycle_number, capacity
          FROM Capacity 
          WHERE file_id = ?
      `;
      const rows = await databaseService.query(query, [file_id]);
      res.json(rows);
  } catch (error: any) {
      const errorMessage = `Internal server error: ${error?.message}`
      res.status(500).json({ error: errorMessage });
  }
});


app.get('/cycle/:file_id', async (req, res) => {
  const { file_id } = req.params;

  try {
      const query = `
          SELECT time, current, voltage
          FROM Cycle 
          WHERE file_id = ?
      `;
      const rows = await databaseService.query(query, [file_id]);

      // Send the response
      res.json(rows);
  } catch (error: any) {
      const errorMessage = `Internal server error: ${error?.message}`
      res.status(500).json({ error: errorMessage });
  }
});

app.get('/columns/:type', async (req, res) => {
  const { type } = req.params;

  try {
      const rows = await databaseService.getColumnNames(type);
      res.json(rows);
  } catch (error: any) {
      const errorMessage = `Internal server error: ${error?.message}`
      res.status(500).json({ error: errorMessage });
  }
});

app.post('/visualize', async (req, res) => {
  const {file_id, type, cols} = req.body;
  try {
    const query = `
        SELECT ${cols.join(',')}
        FROM ${type} 
        WHERE file_id = ${file_id}
    `;
    const rows = await databaseService.query(query); 
    const result: any= {}
    cols.forEach((col: string) => {
      result[col] = []
    })
    rows.forEach((row: object) => {
      Object.entries(row).forEach(([col, value]) => {
        result[col].push(value)
      })
    })
    res.json(result);
} catch (error: any) {
    const errorMessage = `Internal server error: ${error?.message}`
    res.status(500).json({ error: errorMessage });
}
});

const PORT = parseInt(process.env.PORT ?? "5000");
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
