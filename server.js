const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const submissionsFile = path.join(__dirname, 'submissions.json');

// ---- BASIC AUTH MIDDLEWARE ----
const base64 = require('buffer').Buffer;

const USERNAME = 'energinai_03';
const PASSWORD = 'energinai_03';

app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Authentication required.');
  }
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Authentication required.');
  }
  const credentials = base64.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (username === USERNAME && password === PASSWORD) {
    return next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Authentication required.');
  }
});
// ---- END AUTH MIDDLEWARE ----

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/new', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'new.html'));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cors')());

function loadSubmissions() {
  try {
    if (fs.existsSync(submissionsFile)) {
      return JSON.parse(fs.readFileSync(submissionsFile, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load submissions:', error);
  }
  return [];
}

function saveSubmissions(allSubmissions) {
  fs.writeFileSync(submissionsFile, JSON.stringify(allSubmissions, null, 2), 'utf-8');
}

// POST: Submit new audit
app.post('/submit-audit', (req, res) => {
  const d = req.body;
  const submissionId = randomUUID();

  // Store all basic and extra fields, mapping them to the form structure
  const labeledSubmission = {
    id: submissionId,
    timestamp: new Date().toISOString(),

    "Basic Information": {
      "IVRS Number": d.ivrs || "",
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
      // Window-to-wall dynamic data, array of entries
      "Room-wise Window to Wall Ratio": d.windowWallRooms || [],
    },

    "Energy Consumption": {
      "Contract Demand (kWh)": d.contractDemand,
      "Meter Type": d.meterType,
      "Net Metering Present": d.netMetering,
      "Monthly Consumption & Bill": d.monthlyBills || [],
      "Peak Billing Month": d.peakBillingMonth || "",
    },

    "Solar Feasibility": {
      "Existing Solar System": d.solarExists,
      "Available Roof Area (m²)": d.roofArea,
      "Shadowed Area (m²)": d.shadowArea,
      "No Shadow Area (m²)": d.noShadowArea,
      "Calculated Installation Area (m²)": d.usableSolarArea,
      "Roof Orientation": d.roofOrientation,
      "Electric Panel Capacity (kW)": d.panelCapacity,
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
      "Awareness of Energy Saving": d.awareness,
      "Use of Energy Saving Features": d.energyFeatures,
      "Control Type": d.controlType,
    },

    // For full future-proofing:
    "_RAW_POST": d   // optional: comment this out if you do not want raw post backup
  };

  const allSubmissions = loadSubmissions();
  allSubmissions.push(labeledSubmission);
  saveSubmissions(allSubmissions);

  res.json({ status: 'success', id: submissionId });
});

// GET: All or filtered submissions
app.get('/submissions', (req, res) => {
  let allSubmissions = loadSubmissions();
  const { since } = req.query;
  if (since) {
    allSubmissions = allSubmissions.filter(sub =>
      new Date(sub.timestamp) > new Date(since)
    );
  }
  res.json(allSubmissions);
});

// GET: Individual submission
app.get('/submissions/:id', (req, res) => {
  const allSubmissions = loadSubmissions();
  const submission = allSubmissions.find(s => s.id === req.params.id);
  if (submission) {
    res.json(submission);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// POST: Clear all submissions
app.post('/clear-submissions', (req, res) => {
  saveSubmissions([]);
  res.json({ message: 'Submissions cleared' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
