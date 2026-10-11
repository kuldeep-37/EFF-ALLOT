/**
 * Routing Engine
 * Simulates traffic-weighted routing (A* behavior) for the prototype.
 */
class RoutingService {
  
  static simulateRoute(startLoc, endLoc, hospitalName = "") {
    // Generate a pseudo-random but deterministic multiplier based on hospital name and patient location
    // This guarantees different cases will rank hospitals differently (drastic path changes)
    const hash = (hospitalName.charCodeAt(0) || 1) * (startLoc.lat * 1000) * (startLoc.lng * 1000);
    const trafficMultiplier = 1.0 + ((hash % 150) / 100); // 1.0 to 2.5
    
    // Basic Euclidean distance in km (approx)
    const rawDistanceKm = Math.sqrt(Math.pow(startLoc.lat - endLoc.lat, 2) + Math.pow(startLoc.lng - endLoc.lng, 2)) * 111;
    
    // Sometimes routes are longer due to highways vs direct
    const routeDistanceKm = rawDistanceKm * (1.1 + ((hash % 40) / 100));

    // Assume base speed of 40 km/h (0.66 km/min)
    const baseTimeMin = routeDistanceKm / 0.66;
    
    // Actual time with traffic
    const actualTimeMin = Math.round(baseTimeMin * trafficMultiplier);

    // Generate reason
    let reason = "Standard routing.";
    if (trafficMultiplier > 2.0) {
      reason = "Heavy traffic detected. Compensating with alternate arterial roads.";
    } else if (trafficMultiplier < 1.2 && routeDistanceKm > rawDistanceKm * 1.3) {
      reason = "Clear highway route; faster despite much longer distance.";
    } else if (actualTimeMin < 15) {
      reason = "Optimal localized route. Fast ETA.";
    }

    return {
      distanceKm: routeDistanceKm.toFixed(1),
      etaMinutes: actualTimeMin,
      trafficMultiplier: trafficMultiplier.toFixed(2),
      reason
    };
  }
}

module.exports = RoutingService;
