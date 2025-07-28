const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto'); // Node 14.17+ (else use 'uuid' package)

const app = express();
const PORT = process.env.PORT || 3001;
const submissionsFile = path.join(__dirname, 'submissions.json');

app.use(express.json());
app.use(require('cors')());

// Add a unique ID to every new submission
app.post('/submit-audit', (req, res) => {
  const d = req.body;
  const submissionId = randomUUID(); // Unique ID for this submission

  const labeledSubmission = {
    id: submissionId, // Unique id here!
    timestamp: new Date().toISOString(),

    "Basic Information": {
      "Owner Name": d.owner,
      "Built-up Area": d.builtUpArea,
      "Number of Floors": d.floors,
      "Year of Construction": d.constructionYear,
      "Building Type": d.buildingType,
      "Occupancy": d.occupancy,
      "Climate Zone": d.climateZone,
    },

    "Building Envelope": {
      "Wall Type/Insulation": d.wallInsulation,
      "Roof Type/Insulation": d.roofInsulation,
      "Window Type": d.windowType,
      "Window to Wall Ratio": d.windowWallRatio,
      "Presence of Shading": d.shading,
    },

    "Energy Consumption": {
      "Monthly kWh": d.monthlyKwh,
      "Monthly Bill (INR)": d.monthlyBill,
      "Meter Type": d.meterType,
      "Net Metering": d.netMetering,
      "Tariff Slabs": d.tariff,
      "Peak Billing Months": d.peakMonths,
    },

    "Solar Feasibility": {
      "Existing Solar System": d.solarExists,
      "Available Roof Area (sq.m)": d.roofArea,
      "Shadow Analysis": d.shadowAnalysis,
      "Roof Orientation": d.roofOrientation,
      "Panel Capacity (kW)": d.panelCapacity,
    },

    "Appliance Data Per Room": (
      Array.isArray(d.applianceRooms)
        ? d.applianceRooms.map(room => ({
            "Room Type": room.roomType,
            "Appliances": room.appliances,
            "Appliance Details": room.appliancesData
          }))
        : []
    ),

    "Behavioral/Operational": {
      "Awareness": d.awareness,
      "Use of Energy Features": d.energyFeatures,
      "Control Type": d.controlType,
    }
  };

  // load, append, save
  let allSubmissions = [];
  try {
    if (fs.existsSync(submissionsFile)) {
      allSubmissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf-8'));
    }
  } catch (error) {
    allSubmissions = [];
  }

  allSubmissions.push(labeledSubmission);

  fs.writeFileSync(submissionsFile, JSON.stringify(allSubmissions, null, 2), 'utf-8');
  res.json({ status: 'success', id: submissionId });
});

// Get all submissions
app.get('/submissions', (req, res) => {
  let allSubmissions = [];
  try {
    if (fs.existsSync(submissionsFile)) {
      allSubmissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf-8'));
    }
  } catch (error) {
    allSubmissions = [];
  }
  res.json(allSubmissions);
});

// Get one submission by ID
app.get('/submissions/:id', (req, res) => {
  let allSubmissions = [];
  try {
    if (fs.existsSync(submissionsFile)) {
      allSubmissions = JSON.parse(fs.readFileSync(submissionsFile, 'utf-8'));
    }
  } catch (error) {
    allSubmissions = [];
  }
  const submission = allSubmissions.find(s => s.id === req.params.id);
  if (submission) {
    res.json(submission);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
