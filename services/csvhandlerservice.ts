import csv, { Options } from 'csv-parser';
import fs from 'fs';
import { databaseService } from './databaseservice';

type TCSVData = {headers: string[] , rows: any[]};

class CSVHandlerService {
    private readonly table_CSV_Data = "CSV_Data"
    private readonly table_Capacity = "capacity"
    private readonly table_Cycle = "cycle"

    private readonly cols_CSV_Data = ['filename', 'timestamp', 'type']
    private readonly cols_Capacity = ['file_id', 'cycle_number', 'capacity']
    private readonly cols_Cycle = ['file_id', 'cycle_number', 'time', 'current', 'voltage']
    
    private readonly sql_CSV_Data = `INSERT INTO ${this.table_CSV_Data} (filename, type, timestamp) VALUES (?, ?, ?) `
    private readonly sql_Capacity = `INSERT INTO ${this.table_Capacity} (file_id, cycle_number, capacity) VALUES `
    private readonly sql_Cycle = `INSERT INTO ${this.table_Cycle} (file_id, cycle_number, time, current, voltage) VALUES `

    private readonly csv_read_options: Options = {
        
    };

    private readData(filepath: string): Promise<TCSVData> {
        return new Promise((resolve, reject) => {
            const _data: TCSVData = {
                headers: [],
                rows: [],
            }
    
            fs.createReadStream(filepath)
              .pipe(csv(this.csv_read_options))
              .on('headers', (_headers: string[]) => {
                _headers = _headers.map(header => header.toLowerCase());
                _data.headers.push(..._headers)
              })
              .on('data', (data) => _data.rows.push(data))
              .on('end', () => {
                setTimeout(() => {
                    fs.unlink(filepath, ()=>{})
                }, 1000)
                resolve(_data);
              })
              .on('error', (error) => {
                reject(error);
            });;
        })
    }

    private validateHeaders(headers: string[], reqHeaders: string[]): boolean {
        if (headers.length !== reqHeaders.length) {
            return false
        }
        headers = [...new Set(headers)];

        for (let i = 0; i < headers.length; i++) {
            if (headers[i] !== reqHeaders[i]) {
                return false;
            }
        }
        return true;
    }

    private async addToTableCSV_Data(file: Express.Multer.File, type: string): Promise<number> {
        const query = `${this.sql_CSV_Data}`;
        const params = [file.originalname, type, Date.now()]
        const csvDataID = await databaseService.insert(query, params)
        return csvDataID;
    }

    public async handleCSV(file: Express.Multer.File, type: string) {
        const data = await this.readData(file.path);
        const csvDataID = await this.addToTableCSV_Data(file, type)
    }

}

const csvHandlerService = new CSVHandlerService()

export {
    csvHandlerService,
}