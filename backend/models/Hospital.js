const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospital_id: { type: String, required: true, unique: true }, // e.g. HOSP-101
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  capabilities: [{ type: String }], // e.g. ['ICU', 'Ventilator', 'Trauma Team']
  reliability_score: { type: Number, default: 100 },
  icu_normal: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  icu_government: [{
    bed_id: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Reserved', 'Occupied'], default: 'Available' },
    reserved_for_case_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', default: null }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
