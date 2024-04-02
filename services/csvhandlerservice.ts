import csv from 'csv-parser';
import fs from 'fs';
import { databaseService } from './databaseservice';

class CSVHandlerService {
    private readonly table_CSV_Data = "CSV_Data"
    private readonly table_Capacity = "capacity"
    private readonly table_Cycle = "cycle"
    
    private readonly sql_CSV_Data = `INSERT INTO ${this.table_CSV_Data} (filename, type, timestamp) VALUES (?, ?, ?) `
    private readonly sql_Capacity = `INSERT INTO ${this.table_Capacity} (file_id, cycle_number, capacity) VALUES `
    private readonly sql_Cycle = `INSERT INTO ${this.table_Cycle} (file_id, cycle_number, time, current, voltage) VALUES `

    public handleCSV(filepath: string) {
        const fileRows: any[] = [];

        fs.createReadStream(filepath)
          .pipe(csv())
          .on('data', (data) => fileRows.push(data))
          .on('end', () => {
          });
  
          fs.unlink(filepath, ()=>{})
    }

}

const csvHandlerService = new CSVHandlerService()

export {
    csvHandlerService,
}