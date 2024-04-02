import csv, { Options } from 'csv-parser';
import fs from 'fs';
import { databaseService } from './databaseservice';

class CSVHandlerService {
    private readonly table_CSV_Data = "CSV_Data"
    private readonly table_Capacity = "capacity"
    private readonly table_Cycle = "cycle"

    private readonly cols_CSV_Data = ['filename', 'type', 'timestamp']
    private readonly cols_Capacity = ['file_id', 'cycle_number', 'capacity']
    private readonly cols_Cycle = ['file_id', 'cycle_number', 'time', 'current', 'voltage']
    
    private readonly sql_CSV_Data = `INSERT INTO ${this.table_CSV_Data} (filename, type, timestamp) VALUES (?, ?, ?) `
    private readonly sql_Capacity = `INSERT INTO ${this.table_Capacity} (file_id, cycle_number, capacity) VALUES `
    private readonly sql_Cycle = `INSERT INTO ${this.table_Cycle} (file_id, cycle_number, time, current, voltage) VALUES `

    private readonly csv_read_options: Options = {
        
    };

    public handleCSV(filepath: string) {
        const fileRows: any[] = [];
        const headers: string[] = []

        fs.createReadStream(filepath)
          .pipe(csv(this.csv_read_options))
          .on('headers', (_headers: string[]) => {
            headers.push(..._headers)
          })
          .on('data', (data) => fileRows.push(data))
          .on('end', () => {

            setTimeout(() => {
                fs.unlink(filepath, ()=>{})
            }, 1000)
          });
    }

}

const csvHandlerService = new CSVHandlerService()

export {
    csvHandlerService,
}