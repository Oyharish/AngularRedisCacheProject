const express = require('express');
const { Pool, Client } = require('pg');
const Redis = require('ioredis');
const app = express();
const cors = require('cors');
app.use(cors());

const port = 3000;

const pool = new Pool({
  user: 'postgres',
  password: 'Harish@123',
  host: 'localhost',
  port: 5433,
  database: 'postgres',
});

pool.connect(function (error) {
  if (error) {
    console.log("Unable to connect to the database");
  } else {
    console.log("Successfully connected to the database");
  }
});

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

app.use(express.json());

// Function to update cache from the database
async function updateCache() {
    const result = await pool.query('SELECT * FROM company ORDER BY company.name ASC');
    const companies = result.rows;
    await redis.setex('company_data', 3600, JSON.stringify(companies));
    console.log('Updated Redis cache with data from the database');
    return companies;
  }
  

// Set up the PostgreSQL client to listen for notifications
const pgClient = new Client({
  user: 'postgres',
  password: 'Harish@123',
  host: 'localhost',
  port: 5433,
  database: 'postgres',
});
pgClient.connect();

// Listen for notifications from the database
pgClient.on('notification', async (msg) => {
    console.log('Received notification: ', msg.payload);
    if (msg.channel === 'company_changes') {
      console.log('Received company_changes notification');
      // Update the cache when a notification is received
      await updateCache();
    }
  });
  

app.get('/api/company', async (req, res) => {
  try {
    await updateCache();
    const cachedData = await redis.get('company_data');

    if (cachedData) {
      const cachedCompanies = JSON.parse(cachedData);
      console.log('Fetching data from cache');
      res.json(cachedCompanies);
    } else {
      console.log('Fetching data from database');
      const companies = await updateCache();
      res.json(companies);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/company/search', async (req, res) => {
   
    const nameQuery = req.query.name || '';
    const ageQuery = req.query.age || '';
    const addressQuery = req.query.address || '';
    const salaryQuery = req.query.salary || '';


    try {
      // Query the database based on search parameters
      const query = `
        SELECT * FROM company
        WHERE name ILIKE $1
        AND age::text ILIKE $2
        AND address ILIKE $3
        AND salary::text ILIKE $4
        ORDER BY name ASC
      `;
      const values = [
        `%${nameQuery}%`,
        `%${ageQuery}%`,
        `%${addressQuery}%`,
        `%${salaryQuery}%`
      ];
      
      const result = await pool.query(query, values);
      const filteredCompanies = result.rows;
      console.log(result.rows)
      if (filteredCompanies.length > 0) {
        res.json({ foundInDatabase: true, filteredData: filteredCompanies });
      } else {
        res.json({ foundInDatabase: false });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}/api/company`);
});
