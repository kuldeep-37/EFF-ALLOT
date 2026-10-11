const Hospital = require('../models/Hospital');

/**
 * Matching Engine (Simplified TOPSIS for Prototype)
 */
class MatchingService {
  
  static async findBestHospitals(requirements, caseLocation) {
    try {
      // 1. Filter by hard capabilities
      const hospitals = await Hospital.find({
        capabilities: { $all: requirements || [] }
      });

      if (hospitals.length === 0) {
        return [];
      }

      // 2. Score and Rank (Simplified TOPSIS)
      // Criteria: 
      // - Available Normal ICU (Beneficial)
      // - Reliability Score (Beneficial)
      // - ETA (Cost) - We use A* routing to optimize for TIME, not raw distance
      
      const scoredHospitals = hospitals.map(h => {
        // Time cost using routing engine
        const RoutingService = require('./routingService');
        const route = RoutingService.simulateRoute(caseLocation, h.location, h.name);
        const etaMinutes = route.etaMinutes;
        
        // Basic normalization and weighting
        // Higher score is better. Penalty for higher ETA
        let score = (h.reliability_score * 0.4) + (h.icu_normal.available * 10 * 0.4) - (etaMinutes * 2.0);
        
        return {
          hospital: h,
          score,
          distance: route.distanceKm,
          eta: etaMinutes,
          route
        };
      });

      // Sort descending by score
      scoredHospitals.sort((a, b) => b.score - a.score);

      return scoredHospitals;

    } catch (err) {
      console.error('Matching Error:', err);
      throw err;
    }
  }
  static async triggerReRanking(caseId, currentHospitalId, io) {
    try {
      console.log(`[MatchingEngine] Case ${caseId} REJECTED by hospital ${currentHospitalId}. Triggers TOPSIS re-ranking...`);
      
      // Broadcast the re-ranking action so clients (like Control Room) know TOPSIS is running
      io.emit('action', {
        type: 'case_rejected',
        payload: { caseId, hospital: currentHospitalId }
      });

      // Simulate a 1.5s delay for TOPSIS to run, then re-assign
      setTimeout(() => {
        const nextHospital = "Global Health City";
        console.log(`[MatchingEngine] TOPSIS reassigned Case ${caseId} to ${nextHospital}`);
        
        // Notify Control Room that it's now assigned to another hospital
        io.emit('action', {
          type: 'case_updated',
          caseId: caseId,
          status: `Assigned to ${nextHospital}`
        });

        // We could also emit a request_ambulance targeted at nextHospital here, 
        // but since our prototype HospitalDashboard is hardcoded to "Apollo Hospital",
        // we won't broadcast it globally to prevent it from reappearing in the same dashboard.
      }, 1500);

      return { success: true, message: 'TOPSIS re-ranking triggered successfully' };
    } catch (err) {
      console.error('Re-ranking Error:', err);
      throw err;
    }
  }
}

module.exports = MatchingService;
