require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('./models/Hospital');
const Case = require('./models/Case');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Hospital.deleteMany({});
  await Case.deleteMany({});
  
  await Hospital.create([
    {
      hospital_id: 'HOSP-A',
      name: 'Hospital A',
      location: { lat: 13.0604, lng: 80.2496 },
      capabilities: ['ICU', 'Ventilator'],
      reliability_score: 100,
      icu_normal: { total: 10, available: 5 }
    },
    {
      hospital_id: 'HOSP-B',
      name: 'Hospital B',
      location: { lat: 13.0839, lng: 80.2761 },
      capabilities: ['ICU', 'Ventilator'],
      reliability_score: 100,
      icu_normal: { total: 10, available: 5 }
    }
  ]);

  await Case.insertMany([
    {
      case_id: 'LF-1025',
      severity: 'Critical',
      patient: { location: { lat: 13.0418, lng: 80.2341 }, condition: 'Road Accident', requirements: ['ICU'] },
      history: [{ event: 'Case Created', actor: 'System' }]
    },
    {
      case_id: 'LF-1026',
      severity: 'High',
      patient: { location: { lat: 13.0033, lng: 80.2555 }, condition: 'Cardiac event', requirements: ['ICU'] },
      history: [{ event: 'Case Created', actor: 'System' }]
    },
    {
      case_id: 'LF-1027',
      severity: 'Critical',
      patient: { location: { lat: 12.9784, lng: 80.2185 }, condition: 'Fall', requirements: ['ICU'] },
      history: [{ event: 'Case Created', actor: 'System' }]
    },
    {
      case_id: 'LF-1028',
      severity: 'High',
      patient: { location: { lat: 13.0850, lng: 80.2100 }, condition: 'Breathing', requirements: ['ICU'] },
      history: [{ event: 'Case Created', actor: 'System' }]
    }
  ]);

  console.log('Seeded Hospitals and Case');
  process.exit(0);
});
