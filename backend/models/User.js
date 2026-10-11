const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['ControlRoom', 'Hospital', 'Attender', 'Patient'], 
    required: true 
  },
  // If role is Hospital or Attender, link to specific entity
  entityId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
