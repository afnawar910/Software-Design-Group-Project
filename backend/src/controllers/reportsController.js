const reportsService = require('../services/reportsService');

exports.getVolunteerReport = async (req, res) => {
  try {
    const { format } = req.query;

    if (!format || !['PDF', 'CSV'].includes(format.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid format specified' });
    }

    const report = await reportsService.generateVolunteerReport(format.toUpperCase());

    if (format.toUpperCase() === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="volunteer-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="volunteer-report.csv"');
    }

    res.end(report);
  } catch (error) {
    console.error('Error generating volunteer report:', error);
    res.status(500).json({
      message: 'Error generating report',
      error: error.message
    });
  }
};

exports.getSpecificVolunteerReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    if (!format || !['PDF', 'CSV'].includes(format.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid format specified' });
    }

    const report = await reportsService.generateSpecificVolunteerReport(id, format.toUpperCase());

    if (format.toUpperCase() === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="volunteer-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="volunteer-report.csv"');
    }

    res.end(report);
  } catch (error) {
    console.error('Error generating specific volunteer report:', error);
    res.status(500).json({
      message: 'Error generating report',
      error: error.message
    });
  }
};
exports.getEventReport = async (req, res) => {
  try {
    const { format, startDate, endDate } = req.query;
    
    if (!format || !['PDF', 'CSV'].includes(format.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid format specified' });
    }
    
    const report = await reportsService.generateEventReport(format.toUpperCase(), startDate, endDate);
    
    if (format.toUpperCase() === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="event-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="event-report.csv"');
    }
    
    res.end(report);
  } catch (error) {
    console.error('Error generating event report:', error);
    res.status(500).json({
      message: 'Error generating report',
      error: error.message
    });
  }
};

exports.getSpecificEventReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query;
    
    if (!format || !['PDF', 'CSV'].includes(format.toUpperCase())) {
      return res.status(400).json({ message: 'Invalid format specified' });
    }
    
    const report = await reportsService.generateSpecificEventReport(id, format.toUpperCase());
    
    if (format.toUpperCase() === 'PDF') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="specific-event-report.pdf"');
    } else {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="specific-event-report.csv"');
    }
    
    res.end(report);
  } catch (error) {
    console.error('Error generating specific event report:', error);
    res.status(500).json({
      message: 'Error generating report',
      error: error.message
    });
  }
};
