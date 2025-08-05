const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Connection string (from your MongoDB Atlas setup)
const MONGO_URI = 'mongodb+srv://energinai:energinai@25@cluster0.1voarsw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'auditdb';                 // You can name this whatever you want
const COLLECTION = 'submissions';          // Collection for your audits

app.use(express.json());
app.use(cors());

// Helper function to connect and use the database
async function withDB(callback) {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        await callback(db);
    } finally {
        await client.close();
    }
}

// Endpoint to submit an audit (called by your form)
app.post('/submit-audit', async (req, res) => {
    const submission = { ...req.body, timestamp: new Date() };
    await withDB(async db => {
        const col = db.collection(COLLECTION);
        await col.insertOne(submission);
    });
    res.json({ status: 'success' });
});

// Endpoint to fetch audits with optional 'since' filter (by timestamp)
app.get('/submissions', async (req, res) => {
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    let submissions = [];
    await withDB(async db => {
        const col = db.collection(COLLECTION);
        submissions = await col.find({ timestamp: { $gt: since } }).toArray();
    });
    res.json(submissions);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});




// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const { randomUUID } = require('crypto');

// const app = express();
// const PORT = process.env.PORT || 3001;
// const submissionsFile = path.join(__dirname, 'submissions.json');

// app.use(express.json());
// app.use(require('cors')());

// // Utility: Load all submissions from file
// function loadSubmissions() {
//   try {
//     if (fs.existsSync(submissionsFile)) {
//       return JSON.parse(fs.readFileSync(submissionsFile, 'utf-8'));
//     }
//   } catch (error) {
//     console.error('Failed to load submissions:', error);
//   }
//   return [];
// }

// // Utility: Save all submissions to file
// function saveSubmissions(allSubmissions) {
//   fs.writeFileSync(submissionsFile, JSON.stringify(allSubmissions, null, 2), 'utf-8');
// }

// // Submit new audit
// app.post('/submit-audit', (req, res) => {
//   const d = req.body;
//   const submissionId = randomUUID(); // Unique ID

//   const labeledSubmission = {
//     id: submissionId,
//     timestamp: new Date().toISOString(),

//     "Basic Information": {
//       "Owner Name": d.owner,
//       "Built-up Area": d.builtUpArea,
//       "Number of Floors": d.floors,
//       "Year of Construction": d.constructionYear,
//       "Building Type": d.buildingType,
//       "Occupancy": d.occupancy,
//       "Climate Zone": d.climateZone,
//     },

//     "Building Envelope": {
//       "Wall Type/Insulation": d.wallInsulation,
//       "Roof Type/Insulation": d.roofInsulation,
//       "Window Type": d.windowType,
//       "Window to Wall Ratio": d.windowWallRatio,
//       "Presence of Shading": d.shading,
//     },

//     "Energy Consumption": {
//       "Monthly kWh": d.monthlyKwh,
//       "Monthly Bill (INR)": d.monthlyBill,
//       "Meter Type": d.meterType,
//       "Net Metering": d.netMetering,
//       "Tariff Slabs": d.tariff,
//       "Peak Billing Months": d.peakMonths,
//     },

//     "Solar Feasibility": {
//       "Existing Solar System": d.solarExists,
//       "Available Roof Area (sq.m)": d.roofArea,
//       "Shadow Analysis": d.shadowAnalysis,
//       "Roof Orientation": d.roofOrientation,
//       "Panel Capacity (kW)": d.panelCapacity,
//     },

//     "Appliance Data Per Room": (
//       Array.isArray(d.applianceRooms)
//         ? d.applianceRooms.map(room => ({
//             "Room Type": room.roomType,
//             "Appliances": room.appliances,
//             "Appliance Details": room.appliancesData
//           }))
//         : []
//     ),

//     "Behavioral/Operational": {
//       "Awareness": d.awareness,
//       "Use of Energy Features": d.energyFeatures,
//       "Control Type": d.controlType,
//     }
//   };

//   let allSubmissions = loadSubmissions();
//   allSubmissions.push(labeledSubmission);
//   saveSubmissions(allSubmissions);

//   res.json({ status: 'success', id: submissionId });
// });

// // Get all submissions or only those after a timestamp (delta fetch)
// app.get('/submissions', (req, res) => {
//   let allSubmissions = loadSubmissions();

//   // Optional: filter by ?since=ISO_TIMESTAMP
//   const { since } = req.query;
//   if (since) {
//     allSubmissions = allSubmissions.filter(sub =>
//       new Date(sub.timestamp) > new Date(since)
//     );
//   }

//   res.json(allSubmissions);
// });

// // Get one submission by ID
// app.get('/submissions/:id', (req, res) => {
//   let allSubmissions = loadSubmissions();
//   const submission = allSubmissions.find(s => s.id === req.params.id);
//   if (submission) {
//     res.json(submission);
//   } else {
//     res.status(404).json({ error: 'Not found' });
//   }
// });

// // Optional: clear all submissions (e.g. after local fetch)
// app.post('/clear-submissions', (req, res) => {
//   saveSubmissions([]);
//   res.json({ message: 'Submissions cleared' });
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

