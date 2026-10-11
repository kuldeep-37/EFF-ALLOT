const express = require('express');
const Case = require('../models/Case');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate a random Case ID (e.g. LF-1025)
const generateCaseId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const prefix = chars.charAt(Math.floor(Math.random() * chars.length)) + chars.charAt(Math.floor(Math.random() * chars.length));
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

// Create a new Case
router.post('/', async (req, res) => {
  try {
    const { severity, patient } = req.body;
    
    const newCase = new Case({
      case_id: generateCaseId(),
      severity,
      patient,
      history: [{ event: 'Case Created', actor: 'System' }]
    });

    await newCase.save();
    
    // Broadcast creation
    const io = req.app.get('io');
    io.emit('case_created', newCase);

    res.status(201).json(newCase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Case
router.put('/:id', authMiddleware(), async (req, res) => {
  try {
    const caseId = req.params.id;
    const updateData = req.body;
    const actor = req.user ? req.user.username : 'Unknown';

    const caseDoc = await Case.findOne({ case_id: caseId });
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Apply updates
    Object.keys(updateData).forEach(key => {
      // API level enforcement: Prevent bystanders (no role or Patient role) from editing severity or hospital
      if ((key === 'severity' || key === 'hospital_id') && (!req.user || req.user.role === 'Patient' || !req.user.role)) {
        throw new Error('Forbidden: Bystanders cannot edit severity or hospital assignment');
      }
      caseDoc[key] = updateData[key];
    });

    // Add history log
    caseDoc.history.push({
      event: `Case updated: ${Object.keys(updateData).join(', ')}`,
      actor
    });

    await caseDoc.save();

    // Broadcast update to specific case room
    const io = req.app.get('io');
    io.to(caseId).emit('case_updated', caseDoc);
    io.emit('action', { type: 'case_updated', caseId: caseDoc.case_id, status: caseDoc.status });

    res.json(caseDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a Case by ID
router.get('/:id', async (req, res) => {
  try {
    const caseDoc = await Case.findOne({ case_id: req.params.id }).populate('ambulance_id hospital_id');
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all cases (For Control Room)
router.get('/', authMiddleware(['ControlRoom']), async (req, res) => {
  try {
    const cases = await Case.find().populate('ambulance_id hospital_id').sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign Hospital
router.post('/:id/assign-hospital', authMiddleware(['ControlRoom', 'System']), async (req, res) => {
  try {
    const caseId = req.params.id;
    const { hospitalId, routingInfo } = req.body;
    const io = req.app.get('io');
    const actor = req.user ? req.user.username : 'Unknown';

    const caseDoc = await Case.findOne({ case_id: caseId });
    if (!caseDoc) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    caseDoc.hospital_id = hospitalId;
    caseDoc.routing_info = routingInfo;
    caseDoc.status = 'HospitalArrived'; // Or another suitable status like 'HospitalAssigned', let's use 'AmbulanceAssigned' or similar? Wait, the schema allows 'Created', 'AmbulanceAssigned', 'AmbulanceAcknowledged', 'EnRouteToHospital', 'HospitalArrived', 'Resolved', 'Escalated'. We'll keep status as is or update it. Let's just update hospital.
    // Maybe just assign hospital doesn't change case status, or sets it to something.

    caseDoc.history.push({
      event: `Hospital assigned: ${hospital.name}`,
      actor
    });

    await caseDoc.save();

    const updatedCase = await Case.findById(caseDoc._id).populate('hospital_id ambulance_id');
    
    console.log('[ASSIGN] caseId:', caseId);
    console.log('[ASSIGN] broadcasting payload:', JSON.stringify(updatedCase, null, 2));
    console.log('[ASSIGN] room', caseId, 'has', io.sockets.adapter.rooms.get(caseId)?.size || 0, 'connected sockets');
    
    // Broadcast update to specific case room for Attender Dashboard and Ambulance/Driver
    io.to(caseId).emit('case:hospitalAssigned', updatedCase);
    
    // Also broadcast generic case update just in case other parts rely on it
    io.to(caseId).emit('case_updated', updatedCase);
    io.emit('action', { type: 'case_updated', caseId: caseDoc.case_id }); // Broadcast to control room

    res.json(caseDoc);
  } catch (err) {
    console.error('Assign Hospital Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
