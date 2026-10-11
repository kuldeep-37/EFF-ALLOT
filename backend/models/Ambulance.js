const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  ambulance_id: { type: String, required: true, unique: true }, // e.g. AMB-001
  status: { 
    type: String, 
    enum: ['Available', 'Assigned', 'EnRouteToHospital', 'Fault', 'Offline'],
    default: 'Available'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  equipment: [{ type: String }],
  crew: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
