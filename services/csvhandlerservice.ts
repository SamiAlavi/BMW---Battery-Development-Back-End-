import csv, { Options } from 'csv-parser';
import fs from 'fs';
import { databaseService } from './databaseservice';

type TCSVData = {headers: string[] , rows: any[]};

class CSVHandlerService {    
    private SQL_BATCH_SIZE = 6000

    private readonly table_CSV_Data = "CSV_Data"
    private readonly table_Capacity = "capacity"
    private readonly table_Cycle = "cycle"

    private readonly cols_CSV_Data = ['filename', 'timestamp', 'type']
    private readonly cols_Capacity = [ 'capacity', 'cycle_number', 'file_id']
    private readonly cols_Cycle = [ 'current', 'cycle_number', 'file_id', 'time', 'voltage' ]
    
    private readonly sql_CSV_Data = `INSERT INTO ${this.table_CSV_Data} (${this.cols_CSV_Data.join(',')}) VALUES (?, ?, ?) `
    private readonly sql_Capacity = `INSERT INTO ${this.table_Capacity} (${this.cols_Capacity.join(',')}) VALUES `
    private readonly sql_Cycle = `INSERT INTO ${this.table_Cycle} (${this.cols_Cycle.join(',')} VALUES `

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

    private filterFileIdCol(arr: string[]): string[] {
        return arr.filter((col) => col!=='file_id')
    }

    private validateHeaders(headers: string[], reqHeaders: string[]): boolean {
        if (headers.length !== reqHeaders.length) {
            return false
        }
        headers = [...new Set(headers)].sort();

        for (let i = 0; i < headers.length; i++) {
            if (headers[i] !== reqHeaders[i]) {
                return false;
            }
        }
        return true;
    }

    private async runBatches(csvDataID: number, insertSql: string, placeholder: string, rows: any[], mapperFunc: (csvDataID: number, row: any) => any[]) {
        for (let i=0; i<rows.length; i+=this.SQL_BATCH_SIZE) {
            const batch = rows.slice(i, i + this.SQL_BATCH_SIZE);
            const placeholders = batch.map(() => placeholder).join(',');
            const values = batch.flatMap(row => mapperFunc(csvDataID, row));
            const sql = `${insertSql}${placeholders}`
            await databaseService.insert(sql, values)
        }
    }

    private async addToTableCSV_Data(filename: string, type: string): Promise<number> {
        const query = `${this.sql_CSV_Data}`;
        const params = [filename, Date.now(), type]
        const csvDataID = await databaseService.insert(query, params)
        return csvDataID;
    }

    private mapperCapacity(csvDataID: number, row: any) {
        const cycle_number = parseInt(row.cycle_number)
        const capacity = parseFloat(row.capacity)
        return [capacity, cycle_number, csvDataID] // [ 'capacity', 'cycle_number', 'file_id']
    }

    private async addToTableCapacty(csvDataID: number, data: TCSVData) {
        const cols = this.filterFileIdCol(this.cols_Capacity)
        const validate = this.validateHeaders(data.headers, cols)
        if (!validate) {
            throw Error(`Required Columns: ${cols.join(', ')}`)
        }
        const insertSql = `${this.sql_Capacity}`;
        const placeholder = `(${this.cols_Capacity.map((_) => '?').join(',')})`
        await this.runBatches(csvDataID, insertSql, placeholder, data.rows, this.mapperCapacity)
    }

    public async handleCSV(file: Express.Multer.File, type: string) {
        const data = await this.readData(file.path);
        const csvDataID = await this.addToTableCSV_Data(file.originalname, type)
        if (type === 'capacity') {
            await this.addToTableCapacty(csvDataID, data)
        }
        else if (type === 'cycle') {
        }
    }

}

const csvHandlerService = new CSVHandlerService()

export {
    csvHandlerService,
}