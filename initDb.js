const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_NAME;
const scriptDir = 'scripts'
const scriptPath = path.join(scriptDir, 'schema.sql');

const db = new sqlite3.Database(dbPath);

function initSchema() {
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');

    // Execute the SQL script
    db.serialize(() => {
        db.exec(sqlScript, function(err) {
            if (err) {
                console.error('Error executing script:', err);
            } else {
                console.log('Script executed successfully');
            }
            // Close the database connection
            db.close();
        });
    });    
}

initSchema()