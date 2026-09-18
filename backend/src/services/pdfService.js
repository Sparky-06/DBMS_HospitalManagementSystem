const PDFDocument = require('pdfkit');

/**
 * PDF Service
 * Generates an official, publication-quality Patient Summary & Discharge Report
 * using live database aggregates fetched via patientService.
 */
class PDFService {
  /**
   * Generates a patient summary report stream
   * @param {Object} patient Complete patient aggregate object
   * @param {Object} res Express response stream
   */
  generatePatientReport(patient, res) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Medical Report - ${patient.p_id}`,
        Author: 'Hospital Patient Management System',
        Subject: `Patient Summary for ${patient.fname} ${patient.lname}`
      }
    });

    // Pipe the document straight into the Express response stream
    doc.pipe(res);

    // Primary Colors
    const primaryColor = '#1e3a8a'; // Deep Navy
    const secondaryColor = '#0284c7'; // Sky Blue
    const darkText = '#1f2937'; // Slate 800
    const lightText = '#64748b'; // Slate 500
    const accentBg = '#f1f5f9'; // Slate 100

    // Header / Banner
    doc
      .rect(40, 40, 515, 65)
      .fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('HOSPITAL PATIENT MANAGEMENT SYSTEM (HPMS)', 55, 52)
      .fontSize(11)
      .font('Helvetica')
      .text('Comprehensive Clinical Summary & Patient Record', 55, 74)
      .fontSize(9)
      .text(`Generated: ${new Date().toLocaleString()}`, 380, 74, { align: 'right', width: 160 });

    doc.moveDown(3);

    // 1. PATIENT DEMOGRAPHICS & INFORMATION
    let y = 120;
    doc
      .fillColor(primaryColor)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('1. PATIENT DEMOGRAPHICS', 40, y);

    y += 18;
    doc.rect(40, y, 515, 75).fill(accentBg);

    doc.fillColor(darkText).fontSize(10).font('Helvetica');
    const col1 = 55;
    const col2 = 220;
    const col3 = 390;

    const fullName = `${patient.fname} ${patient.mname ? patient.mname + ' ' : ''}${patient.lname}`;

    doc.text(`Patient ID: `, col1, y + 10, { continued: true }).font('Helvetica-Bold').text(patient.p_id);
    doc.font('Helvetica').text(`Full Name: `, col1, y + 26, { continued: true }).font('Helvetica-Bold').text(fullName);
    doc.font('Helvetica').text(`Gender: `, col1, y + 42, { continued: true }).font('Helvetica-Bold').text(patient.gender);

    doc.font('Helvetica').text(`Date of Birth: `, col2, y + 10, { continued: true }).font('Helvetica-Bold').text(patient.dob || 'N/A');
    doc.font('Helvetica').text(`Derived Age: `, col2, y + 26, { continued: true }).font('Helvetica-Bold').text(`${patient.age ?? 'N/A'} yrs`);
    doc.font('Helvetica').text(`Phone(s): `, col2, y + 42, { continued: true }).font('Helvetica-Bold').text(patient.phones?.length ? patient.phones.join(', ') : 'None listed');

    doc.font('Helvetica').text(`Allergies: `, col3, y + 10, { continued: true }).font('Helvetica-Bold')
      .fillColor(patient.allergies?.length ? '#b91c1c' : darkText)
      .text(patient.allergies?.length ? patient.allergies.join(', ') : 'No known allergies');

    doc.fillColor(darkText).font('Helvetica').text(`Room: `, col3, y + 26, { continued: true }).font('Helvetica-Bold')
      .text(patient.assigned_room ? `${patient.assigned_room.r_id} (${patient.assigned_room.room_type})` : 'Not Admitted');

    // 2. ROOM & ADMISSION
    y += 90;
    doc
      .fillColor(primaryColor)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('2. ROOM & ADMISSION DETAILS', 40, y);

    y += 18;
    doc.rect(40, y, 515, 36).fill(accentBg);
    doc.fillColor(darkText).fontSize(9.5).font('Helvetica');
    if (patient.assigned_room) {
      doc.text(
        `Assigned to Room ${patient.assigned_room.r_id} (${patient.assigned_room.room_type}) | Capacity: ${patient.assigned_room.capacity} | Status: ${patient.assigned_room.availability ? 'Available' : 'Occupied'}`,
        55,
        y + 12
      );
    } else {
      doc.text('No current room assignment on record.', 55, y + 12);
    }

    // 3. CONSULTATION HISTORY
    y += 50;
    doc
      .fillColor(primaryColor)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('3. CONSULTATIONS & DOCTOR ENCOUNTERS', 40, y);

    y += 18;
    if (!patient.consultations || patient.consultations.length === 0) {
      doc.fillColor(lightText).fontSize(10).font('Helvetica-Oblique').text('No consultation records found for this patient.', 45, y);
      y += 15;
    } else {
      // Table Header
      doc.rect(40, y, 515, 20).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('Doctor', 45, y + 5);
      doc.text('Department', 170, y + 5);
      doc.text('Date & Time', 280, y + 5);
      doc.text('Clinical Notes', 390, y + 5);
      y += 20;

      patient.consultations.slice(0, 5).forEach((c, idx) => {
        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, y, 515, 22).fill(rowBg);
        doc.fillColor(darkText).fontSize(8.5).font('Helvetica');
        doc.text(c.doctor_name || c.emp_id, 45, y + 6);
        doc.text(c.department || 'General', 170, y + 6);
        doc.text(`${c.consultation_date} ${c.consultation_time.slice(0, 5)}`, 280, y + 6);
        doc.text((c.notes || '-').slice(0, 30), 390, y + 6);
        y += 22;
      });
    }

    // 4. DIAGNOSTIC TEST REPORTS
    y += 15;
    doc
      .fillColor(primaryColor)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('4. DIAGNOSTIC & LABORATORY REPORTS', 40, y);

    y += 18;
    if (!patient.test_reports || patient.test_reports.length === 0) {
      doc.fillColor(lightText).fontSize(10).font('Helvetica-Oblique').text('No test reports recorded.', 45, y);
      y += 15;
    } else {
      doc.rect(40, y, 515, 20).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('Test ID', 45, y + 5);
      doc.text('Investigation Type', 120, y + 5);
      doc.text('Result & Interpretation', 260, y + 5);
      doc.text('Reported At', 460, y + 5);
      y += 20;

      patient.test_reports.slice(0, 5).forEach((t, idx) => {
        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, y, 515, 22).fill(rowBg);
        doc.fillColor(darkText).fontSize(8.5).font('Helvetica');
        doc.text(t.test_id, 45, y + 6);
        doc.text(t.test_type, 120, y + 6);
        doc.text((t.result || '-').slice(0, 45), 260, y + 6);
        doc.text(String(t.report_date).slice(0, 10), 460, y + 6);
        y += 22;
      });
    }

    // 5. BILLING SUMMARY
    y += 15;
    doc
      .fillColor(primaryColor)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('5. BILLING & FINANCIAL INVOICES', 40, y);

    y += 18;
    if (!patient.bills || patient.bills.length === 0) {
      doc.fillColor(lightText).fontSize(10).font('Helvetica-Oblique').text('No billing history found.', 45, y);
      y += 15;
    } else {
      doc.rect(40, y, 515, 20).fill(secondaryColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('Bill ID', 45, y + 5);
      doc.text('Amount (INR)', 160, y + 5);
      doc.text('Status', 280, y + 5);
      doc.text('Invoice Date', 400, y + 5);
      y += 20;

      let totalAmount = 0;
      patient.bills.forEach((b, idx) => {
        totalAmount += parseFloat(b.amount);
        const rowBg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
        doc.rect(40, y, 515, 20).fill(rowBg);
        doc.fillColor(darkText).fontSize(8.5).font('Helvetica');
        doc.text(b.b_id, 45, y + 5);
        doc.text(`Rs. ${parseFloat(b.amount).toFixed(2)}`, 160, y + 5);
        doc.text(b.status, 280, y + 5);
        doc.text(String(b.bill_date).slice(0, 10), 400, y + 5);
        y += 20;
      });

      // Total summary row
      doc.rect(40, y, 515, 22).fill(accentBg);
      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold');
      doc.text('Total Invoiced Amount:', 45, y + 6);
      doc.text(`Rs. ${totalAmount.toFixed(2)}`, 160, y + 6);
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor(lightText)
      .font('Helvetica')
      .text('Confidential Medical Document - HPMS Hospital System', 40, 780, {
        align: 'center',
        width: 515
      });

    doc.end();
  }
}

module.exports = new PDFService();
