const Hospital = require('../models/Hospital');
const GovernmentReservation = require('../models/GovernmentReservation');
const Case = require('../models/Case');

/**
 * Government Reserve Engine
 */
class GovReserveService {

  static async reserveBed(hospitalId, bedId, caseId, userId, io) {
    try {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) throw new Error('Hospital not found');

      const bed = hospital.icu_government.find(b => b.bed_id === bedId);
      if (!bed) throw new Error('Bed not found');
      if (bed.status !== 'Available') throw new Error('Bed is not available');

      // 1. Update Hospital Bed
      bed.status = 'Reserved';
      bed.reserved_for_case_id = caseId;
      await hospital.save();

      // 2. Create Audit Record
      const reservation = new GovernmentReservation({
        bed_id: bedId,
        hospital_id: hospitalId,
        case_id: caseId,
        reserved_by: userId,
        status_history: [{ status: 'Reserved', actor: userId }]
      });
      await reservation.save();

      // 3. Update Case
      const caseDoc = await Case.findById(caseId);
      if (caseDoc) {
        caseDoc.reserved_bed_id = bedId;
        caseDoc.is_government_bed = true;
        caseDoc.hospital_id = hospitalId;
        caseDoc.history.push({ event: `Government Bed ${bedId} Reserved`, actor: 'ControlRoom' });
        await caseDoc.save();

        if (io) io.to(caseDoc.case_id).emit('case_updated', caseDoc);
      }

      return reservation;
    } catch (err) {
      console.error('Gov Reserve Error:', err);
      throw err;
    }
  }

  static async getAuditLog() {
    return await GovernmentReservation.find().populate('hospital_id case_id reserved_by').sort({ reserved_at: -1 });
  }
}

module.exports = GovReserveService;
