import sqlite3 from 'sqlite3';
require('dotenv').config();

const sqlite3Verbose = sqlite3.verbose()
const dbPath = process.env.DB_NAME ?? "database.db";

class DatabaseService {
    private db = new sqlite3.Database(dbPath);

    constructor() {
    }

    public close(): void {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database connection:', err.message);
                return;
            }
            console.log('Database connection closed.');
        });
    }

    public query(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error executing query:', err.message);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    public insert(sql: string, params: any[] = []): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error executing insert:', err.message);
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }

    public update(sql: string, params: any[] = []): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error executing update:', err.message);
                    reject(err);
                    return;
                }
                resolve(this.changes);
            });
        });
    }

    public delete(sql: string, params: any[] = []): Promise<number> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error executing delete:', err.message);
                    reject(err);
                    return;
                }
                resolve(this.changes);
            });
        });
    }

    public getColumnNames(tableName: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const query = `PRAGMA table_info(${tableName})`;

            this.db.all(query, (err, rows) => {
                if (err) {
                    console.error('Error executing query:', err.message);
                    reject(err);
                    return;
                }

                const columnNames: string[] = []
                rows.forEach((row: any) => {
                    const name: string = row.name
                    if (!name.includes("id")) {
                        columnNames.push(name)
                    }
                })
                resolve(columnNames);
            });
        });
    }
}

const databaseService = new DatabaseService()

export {
    databaseService,
}