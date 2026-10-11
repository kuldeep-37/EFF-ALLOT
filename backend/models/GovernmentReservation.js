const mongoose = require('mongoose');

const governmentReservationSchema = new mongoose.Schema({
  bed_id: { type: String, required: true },
  hospital_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  case_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  reserved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reserved_at: { type: Date, default: Date.now },
  status_history: [{
    status: { type: String, enum: ['Reserved', 'Occupied', 'Released'] },
    timestamp: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('GovernmentReservation', governmentReservationSchema);
