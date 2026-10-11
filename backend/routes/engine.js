const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const DispatchService = require('../services/dispatchService');
const MatchingService = require('../services/matchingService');
const RoutingService = require('../services/routingService');
const GovReserveService = require('../services/govReserveService');

const router = express.Router();

// Dispatch: Auto-assign ambulance
router.post('/dispatch/:caseId', authMiddleware(['ControlRoom', 'System']), async (req, res) => {
  try {
    const io = req.app.get('io');
    const result = await DispatchService.assignAmbulance(req.params.caseId, io);
    res.json(result || { message: 'No available ambulance, escalated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dispatch: Handle Fault
router.post('/dispatch/:caseId/fault/:ambulanceId', authMiddleware(['ControlRoom', 'Attender', 'System']), async (req, res) => {
  try {
    const io = req.app.get('io');
    const result = await DispatchService.handleFault(req.params.caseId, req.params.ambulanceId, io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Matching: Get best hospitals
router.post('/match', authMiddleware(), async (req, res) => {
  try {
    const { requirements, location } = req.body;
    const hospitals = await MatchingService.findBestHospitals(requirements, location);
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Matching: Reject case and trigger re-ranking
router.post('/reject/:caseId', authMiddleware(['Hospital']), async (req, res) => {
  try {
    const io = req.app.get('io');
    const hospitalId = req.body.hospitalId || 'Unknown Hospital';
    const result = await MatchingService.triggerReRanking(req.params.caseId, hospitalId, io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routing: Get ETA
router.post('/route', authMiddleware(), (req, res) => {
  try {
    const { startLoc, endLoc } = req.body;
    const route = RoutingService.simulateRoute(startLoc, endLoc);
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gov Reserve: Allocate bed
router.post('/reserve-gov-bed', authMiddleware(['ControlRoom']), async (req, res) => {
  try {
    const { hospitalId, bedId, caseId } = req.body;
    const io = req.app.get('io');
    
    // Broadcast for prototype UI
    io.emit('action', {
      type: 'bed_reserved',
      payload: { bedId, case_id: caseId }
    });

    res.json({ success: true, message: `Bed ${bedId} reserved for ${caseId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gov Reserve: Audit Log
router.get('/audit-log', authMiddleware(['ControlRoom']), async (req, res) => {
  try {
    const log = await GovReserveService.getAuditLog();
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
