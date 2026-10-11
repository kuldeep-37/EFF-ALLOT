const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  case_id: { type: String, required: true, unique: true }, // e.g. LF-1025
  status: { 
    type: String, 
    enum: ['Created', 'AmbulanceAssigned', 'AmbulanceAcknowledged', 'EnRouteToHospital', 'HospitalArrived', 'Resolved', 'Escalated'],
    default: 'Created'
  },
  severity: { type: String, enum: ['Critical', 'High', 'Moderate', 'Low'], required: true },
  patient: {
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    condition: { type: String },
    requirements: [{ type: String }] // e.g. ['ICU', 'Ventilator']
  },
  ambulance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  routing_info: {
    etaMinutes: { type: Number },
    distanceKm: { type: String },
    reason: { type: String }
  },
  reserved_bed_id: { type: String },
  is_government_bed: { type: Boolean, default: false },
  history: [{
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actor: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
