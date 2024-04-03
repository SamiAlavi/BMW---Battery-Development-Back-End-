import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import { databaseService } from './services/databaseservice';
import { csvHandlerService } from './services/csvhandlerservice';

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
app.post('/upload', upload.array('files'), async (req, res) => {
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

    try {
      for (let file of files) {
        await csvHandlerService.handleCSV(file, type)
      }
    }
    catch (error: any) {
      const errorMessage = `${error?.message}`
      res.status(500).send(errorMessage);
      return
    }

    res.send(`${files.length} files successfully uploaded`);
});

app.get('/csv_data', async (req, res) => {
  try {
      const query = 'SELECT * FROM CSV_Data';
      const rows = await databaseService.query(query);
      res.json(rows);
  } catch (error: any) {
      const errorMessage = `${error?.message}`
      res.status(500).send(errorMessage);
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
    const errorMessage = `${error?.message}`
    res.status(500).send(errorMessage);
}
});

const PORT = parseInt(process.env.PORT ?? "5000");
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
