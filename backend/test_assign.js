const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
require('dotenv').config();

console.log('Test script started. Waiting 8 seconds before assigning hospital...');
setTimeout(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/eff-allot');
  const caseId = 'LF-1025';
  
  const Case = require('./models/Case');
  const caseDoc = await Case.findOne({ case_id: caseId });
  if (!caseDoc) {
     console.log('Case not found! Exiting.');
     process.exit(1);
  }

  // Use a different hospital
  const hospital = await Hospital.findOne({ name: 'Hospital B' });
  if (!hospital) {
    console.error('No hospital found');
    process.exit(1);
  }
  
  const payload = {
    hospitalId: hospital._id,
    routingInfo: {
      etaMinutes: 8,
      distanceKm: 3.2,
      reason: 'Nearest equipped facility (Test Injection)'
    }
  };

  console.log(`Sending assign request to case ${caseId} with hospital ${hospital.name}...`);
  const response = await fetch(`http://localhost:5000/api/cases/${caseId}/assign-hospital`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-mock-role': 'ControlRoom'
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  console.log('Assign result:', result.case_id ? 'Success' : result);
  process.exit(0);
}, 8000);
