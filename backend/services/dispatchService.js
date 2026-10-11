const Ambulance = require('../models/Ambulance');
const Case = require('../models/Case');

/**
 * Dispatch Engine
 * Handles auto-assignment of the nearest available ambulance.
 */
class DispatchService {
  
  // Calculate distance between two lat/lng points (Haversine formula placeholder)
  static calculateDistance(loc1, loc2) {
    // Simplified distance for prototype
    return Math.sqrt(Math.pow(loc1.lat - loc2.lat, 2) + Math.pow(loc1.lng - loc2.lng, 2));
  }

  // Auto-assign nearest ambulance to a case
  static async assignAmbulance(caseId, io) {
    try {
      const caseDoc = await Case.findOne({ case_id: caseId });
      if (!caseDoc || caseDoc.status !== 'Created') return null;

      const availableAmbulances = await Ambulance.find({ status: 'Available' });
      if (availableAmbulances.length === 0) {
        // Trigger Escalation if no ambulance available
        caseDoc.status = 'Escalated';
        caseDoc.history.push({ event: 'Escalated: No ambulance available', actor: 'System' });
        await caseDoc.save();
        if(io) io.to(caseId).emit('case_updated', caseDoc);
        return null;
      }

      // Find nearest
      let nearestAmbulance = availableAmbulances[0];
      let minDistance = this.calculateDistance(caseDoc.patient.location, nearestAmbulance.location);

      for (let i = 1; i < availableAmbulances.length; i++) {
        const dist = this.calculateDistance(caseDoc.patient.location, availableAmbulances[i].location);
        if (dist < minDistance) {
          minDistance = dist;
          nearestAmbulance = availableAmbulances[i];
        }
      }

      // Assign
      nearestAmbulance.status = 'Assigned';
      await nearestAmbulance.save();

      caseDoc.ambulance_id = nearestAmbulance._id;
      caseDoc.status = 'AmbulanceAssigned';
      caseDoc.history.push({ event: `Ambulance ${nearestAmbulance.ambulance_id} Auto-Assigned`, actor: 'System' });
      await caseDoc.save();

      if(io) io.to(caseId).emit('case_updated', caseDoc);
      return caseDoc;
    } catch (err) {
      console.error('Dispatch Error:', err);
      throw err;
    }
  }

  // Handle ambulance fault and reassign
  static async handleFault(caseId, ambulanceId, io) {
    try {
      const ambulance = await Ambulance.findById(ambulanceId);
      if (ambulance) {
        ambulance.status = 'Fault';
        await ambulance.save();
      }

      const caseDoc = await Case.findOne({ case_id: caseId });
      if (caseDoc) {
        caseDoc.status = 'Created'; // Reset to created to trigger re-assignment
        caseDoc.ambulance_id = null;
        caseDoc.history.push({ event: `Ambulance ${ambulance ? ambulance.ambulance_id : 'Unknown'} Fault declared. Reassigning.`, actor: 'System' });
        await caseDoc.save();
        
        // Re-run assignment
        return await this.assignAmbulance(caseId, io);
      }
    } catch (err) {
      console.error('Dispatch Fault Error:', err);
      throw err;
    }
  }
}

module.exports = DispatchService;
