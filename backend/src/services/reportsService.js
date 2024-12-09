const PDFDocument = require('pdfkit');
const { User, VolunteerHistory, Event, Profile } = require('../../models');
const { Op } = require('sequelize');

const reportsService = {
  generateVolunteerReport: async (format) => {
    try {
      const volunteers = await User.findAll({
        where: {
          role: 'volunteer',
          isRegistered: true
        },
        include: [
          {
            model: Profile,
            as: 'Profile',
            required: false
          },
          {
            model: VolunteerHistory,
            as: 'VolunteerHistories',
            required: false,
            include: [{
              model: Event,
              required: false,
              attributes: [
                'eventName',
                'eventDescription',
                'eventDate',
                'startTime',
                'endTime',
                'city',
                'state',
                'urgency'
              ]
            }]
          }
        ],
        order: [
          ['email', 'ASC'],
          [{ model: VolunteerHistory, as: 'VolunteerHistories' }, Event, 'eventDate', 'DESC']
        ]
      });

      if (!volunteers || volunteers.length === 0) {
        throw new Error('No volunteers found in the system');
      }

      console.log(`Found ${volunteers.length} volunteers`);

      const reportData = volunteers.map(volunteer => ({
        email: volunteer.email,
        fullName: volunteer.Profile?.fullName || 'N/A',
        location: `${volunteer.Profile?.city || 'N/A'}, ${volunteer.Profile?.state || 'N/A'}`,
        totalEvents: volunteer.VolunteerHistories?.length || 0,
        participationHistory: (volunteer.VolunteerHistories || []).map(history => ({
          eventName: history.Event?.eventName || 'N/A',
          eventDate: history.Event?.eventDate || 'N/A',
          eventTime: history.Event ? `${history.Event.startTime} - ${history.Event.endTime}` : 'N/A',
          location: history.Event ? `${history.Event.city}, ${history.Event.state}` : 'N/A',
          urgency: history.Event?.urgency || 'N/A',
          status: history.participationStatus || 'Not Attended',
          matchedAt: history.matchedAt || 'N/A'
        }))
      }));

      console.log('Processed report data:', reportData);

      if (format === 'PDF') {
        return await generatePDFReport(reportData);
      } else {
        return await generateCSVReport(reportData);
      }
    } catch (error) {
      console.error('Error in generateVolunteerReport:', error);
      throw error;
    }
  },

  generateSpecificVolunteerReport: async (volunteerId, format) => {
    try {
      const volunteer = await User.findOne({
        where: {
          id: volunteerId,
          role: 'volunteer',
          isRegistered: true
        },
        include: [
          {
            model: Profile,
            as: 'Profile',
            required: false
          },
          {
            model: VolunteerHistory,
            as: 'VolunteerHistories',
            required: false,
            include: [{
              model: Event,
              attributes: [
                'eventName',
                'eventDescription',
                'eventDate',
                'startTime',
                'endTime',
                'city',
                'state',
                'urgency',
                'requiredSkills'
              ]
            }]
          }
        ],
        order: [
          [{ model: VolunteerHistory, as: 'VolunteerHistories' }, Event, 'eventDate', 'DESC']
        ]
      });

      if (!volunteer) {
        throw new Error('Volunteer not found');
      }

      const reportData = [{
        email: volunteer.email,
        fullName: volunteer.Profile?.fullName || 'Profile Not Completed',
        location: volunteer.Profile ?
          `${volunteer.Profile.city || 'N/A'}, ${volunteer.Profile.state || 'N/A'}` :
          'Profile Not Completed',
        skills: volunteer.Profile?.skills || [],
        totalEvents: volunteer.VolunteerHistories?.length || 0,
        participationHistory: (volunteer.VolunteerHistories || []).map(history => ({
          eventName: history.Event.eventName,
          eventDescription: history.Event.eventDescription,
          eventDate: history.Event.eventDate,
          eventTime: `${history.Event.startTime} - ${history.Event.endTime}`,
          location: `${history.Event.city}, ${history.Event.state}`,
          urgency: history.Event.urgency,
          requiredSkills: history.Event.requiredSkills,
          status: history.participationStatus || 'Not Attended',
          matchedAt: history.matchedAt
        }))
      }];

      if (format === 'PDF') {
        return await generatePDFReport(reportData, true);
      } else {
        return await generateCSVReport(reportData, true);
      }
    } catch (error) {
      console.error('Error generating specific volunteer report:', error);
      throw error;
    }
  },

  //Event 
generateEventReport: async (format, startDate, endDate) => {
  try {
    const events = await Event.findAll({
      where: { eventDate: { [Op.between]: [startDate, endDate] } },
      include: [
        {
          model: VolunteerHistory,
          as: 'VolunteerHistories',
          required: false,
          include: [{ model: User, include: [{ model: Profile, as: 'Profile' }] }]
        }
      ]
    });

    if (!events.length) throw new Error('No events found in the specified date range');

    const reportData = events.map(event => ({
      eventName: event.eventName,
      eventDate: event.eventDate,
      location: `${event.city}, ${event.state}`,
      urgency: event.urgency || 'N/A', // Added urgency
      description: event.eventDescription || 'N/A', // Added event description
      volunteersMatched: (event.VolunteerHistories || []).filter(history => history.participationStatus === 'Matched - Pending Attendance').length,
      matchedVolunteers: (event.VolunteerHistories || [])
        .filter(history => history.participationStatus === 'Matched - Pending Attendance')
        .map(history => ({
          name: history.User?.Profile?.fullName || 'N/A',
          email: history.User?.email || 'N/A',
          matchedAt: history.matchedAt || 'N/A'
        }))
    }));

    return format === 'PDF'
      ? await generateEventPDFReport(reportData)
      : await generateEventCSVReport(reportData);
  } catch (error) {
    console.error('Error in generateEventReport:', error);
    throw error;
  }
},generateSpecificEventReport: async (eventId, format) => {
  try {
    const event = await Event.findOne({
      where: { id: eventId },
      include: [
        {
          model: VolunteerHistory,
          as: 'VolunteerHistories',
          required: false,
          include: [{ model: User, include: [{ model: Profile, as: 'Profile' }] }]
        }
      ]
    });

    if (!event) throw new Error('Event not found');

    const reportData = {
      eventName: event.eventName,
      eventDate: event.eventDate,
      location: `${event.city}, ${event.state}`,
      urgency: event.urgency || 'N/A', 
      description: event.eventDescription || 'N/A', 
      volunteers: (event.VolunteerHistories || [])
        .filter(history => history.participationStatus === 'Matched - Pending Attendance')
        .map(history => ({
          name: history.User?.Profile?.fullName || 'N/A',
          email: history.User?.email || 'N/A',
          status: history.participationStatus || 'N/A',
          matchedAt: history.matchedAt || 'N/A'
        }))
    };

    return format === 'PDF'
      ? await generateSpecificEventPDFReport(reportData)
      : await generateSpecificEventCSVReport(reportData);
  } catch (error) {
    console.error('Error in generateSpecificEventReport:', error);
    throw error;
  }
}
};

const generateParticipationStats = (history) => {
  const total = history.length;
  const stats = {
    total,
    notAttended: history.filter(h => h.status === 'Not Attended').length,
    matched: history.filter(h => h.status === 'Matched - Pending Attendance').length,
    attended: history.filter(h => h.status === 'Attended').length,
    cancelled: history.filter(h => h.status === 'Cancelled').length
  };
  return stats;
};

const generatePDFReport = async (data, isDetailedReport = false) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting PDF generation');
      const doc = new PDFDocument({
        autoFirstPage: true,
        bufferPages: true,
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        size: 'A4'
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('Volunteer Participation Report', {
          align: 'center'
        });

      // File generated date
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleString()}`, {
          align: 'right'
        });
      doc.moveDown();

      data.forEach(volunteer => {
        // Volunteer information section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('Volunteer Information');

        doc.fontSize(12)
          .font('Helvetica')
          .text(`Name: ${volunteer.fullName}`)
          .text(`Email: ${volunteer.email}`)
          .text(`Location: ${volunteer.location}`)

        const stats = generateParticipationStats(volunteer.participationHistory);
        doc.moveDown()
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Participation Statistics')
          .font('Helvetica')
          .text(`Total Events: ${stats.total}`)
          .text(`Not Attended: ${stats.notAttended} / ${stats.total}`)
          .text(`Currently Matched: ${stats.matched} / ${stats.total}`)
          .text(`Attended: ${stats.attended} / ${stats.total}`)
          .text(`Cancelled: ${stats.cancelled} / ${stats.total}`);

        if (volunteer.skills?.length > 0) {
          doc.moveDown()
            .text(`Skills: ${volunteer.skills.join(', ')}`);
        }
        doc.moveDown();

        // Participation history section
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('Participation History');
        doc.moveDown(0.5);

        if (volunteer.participationHistory.length > 0) {
          volunteer.participationHistory.forEach(history => {
            doc.fontSize(12)
              .font('Helvetica-Bold')
              .text(history.eventName);
            doc.fontSize(10)
              .font('Helvetica')
              .text(`Date: ${new Date(history.eventDate).toLocaleDateString()}`)
              .text(`Time: ${history.eventTime}`)
              .text(`Location: ${history.location}`)
              .text(`Status: ${history.status}`)
              .text(`Urgency: ${history.urgency}`);

            if (isDetailedReport) {
              doc.text(`Description: ${history.eventDescription}`)
                .text(`Required Skills: ${history.requiredSkills?.join(', ')}`);
            }
            doc.moveDown(0.5);
          });
        } else {
          doc.fontSize(12)
            .font('Helvetica')
            .text('No participation history');
        }
        doc.moveDown();

        if (data.indexOf(volunteer) !== data.length - 1) {
          doc.addPage();
        }
      });

      doc.end();
    } catch (error) {
      console.error('Error in PDF generation:', error);
      reject(error);
    }
  });
};

const generateCSVReport = async (data, isDetailedReport = false) => {
  try {
    const records = [];

    data.forEach(volunteer => {
      if (volunteer.participationHistory.length > 0) {
        volunteer.participationHistory.forEach(history => {
          const record = {
            volunteerName: volunteer.fullName,
            volunteerEmail: volunteer.email,
            volunteerLocation: volunteer.location,
            eventName: history.eventName,
            eventDate: new Date(history.eventDate).toLocaleDateString(),
            eventTime: history.eventTime,
            eventLocation: history.location,
            status: history.status,
            urgency: history.urgency
          };

          if (isDetailedReport) {
            record.eventDescription = history.eventDescription;
            record.requiredSkills = history.requiredSkills.join(', ');
            record.volunteerSkills = volunteer.skills.join(', ');
          }

          records.push(record);
        });
      } else {
        records.push({
          volunteerName: volunteer.fullName,
          volunteerEmail: volunteer.email,
          volunteerLocation: volunteer.location,
          eventName: 'No participation history',
          eventDate: '',
          eventTime: '',
          eventLocation: '',
          status: '',
          urgency: ''
        });
      }
    });

    const headers = [
      { id: 'volunteerName', title: 'VOLUNTEER NAME' },
      { id: 'volunteerEmail', title: 'EMAIL' },
      { id: 'volunteerLocation', title: 'VOLUNTEER LOCATION' },
      { id: 'eventName', title: 'EVENT NAME' },
      { id: 'eventDate', title: 'EVENT DATE' },
      { id: 'eventTime', title: 'EVENT TIME' },
      { id: 'eventLocation', title: 'EVENT LOCATION' },
      { id: 'status', title: 'STATUS' },
      { id: 'urgency', title: 'URGENCY' }
    ];

    if (isDetailedReport) {
      headers.push(
        { id: 'eventDescription', title: 'EVENT DESCRIPTION' },
        { id: 'requiredSkills', title: 'REQUIRED SKILLS' },
        { id: 'volunteerSkills', title: 'VOLUNTEER SKILLS' }
      );
    }

    let csvContent = headers.map(header => header.title).join(',') + '\n';

    records.forEach(record => {
      csvContent += headers.map(header => {
        const field = record[header.id]?.toString() || '';
        return `"${field.replace(/"/g, '""')}"`;
      }).join(',') + '\n';
    });

    return Buffer.from(csvContent, 'utf-8');
  } catch (error) {
    console.error('Error generating CSV:', error);
    throw error;
  }
};
//all event pdf
const generateEventPDFReport = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('Event Report', { align: 'center' });

      //generation date
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' })
         .moveDown();

      data.forEach(event => {
        //name 
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(event.eventName)
           .moveDown(0.5);

        //event details
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Description: ', { continued: true })
           .font('Helvetica')
           .text(event.description || 'N/A');

        doc.font('Helvetica-Bold')
           .text('Date: ', { continued: true })
           .font('Helvetica')
           .text(new Date(event.eventDate).toLocaleDateString());

        doc.font('Helvetica-Bold')
           .text('Location: ', { continued: true })
           .font('Helvetica')
           .text(event.location);

        doc.font('Helvetica-Bold')
           .text('Urgency: ', { continued: true })
           .font('Helvetica')
           .text(event.urgency);

        doc.font('Helvetica-Bold')
           .text('Total Matched Volunteers: ', { continued: true })
           .font('Helvetica')
           .text(event.volunteersMatched.toString())
           .moveDown(1);

        //volunteers Section
        if (event.matchedVolunteers.length > 0) {
          doc.fontSize(16)
             .font('Helvetica-Bold')
             .text('Matched Volunteers')
             .moveDown();

          event.matchedVolunteers.forEach(volunteer => {
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Name: ', { continued: true })
               .font('Helvetica')
               .text(volunteer.name);

            doc.font('Helvetica-Bold')
               .text('Email: ', { continued: true })
               .font('Helvetica')
               .text(volunteer.email);

            doc.font('Helvetica-Bold')
               .text('Matched At: ', { continued: true })
               .font('Helvetica')
               .text(new Date(volunteer.matchedAt).toLocaleString())
               .moveDown();
          });
        } else {
          doc.font('Helvetica')
             .text('No matched volunteers found.')
             .moveDown();
        }

        doc.addPage();
      });

      doc.end();
    } catch (error) {
      console.error('Error in generateEventPDFReport:', error);
      reject(error);
    }
  });
};
//all event csv
const generateEventCSVReport = async (data) => {
  try {
    let csvContent = 'Event Name,Description,Date,Location,Urgency,Total Matched Volunteers,Volunteer Name,Volunteer Email,Matched At\n';

    data.forEach(event => {
      event.matchedVolunteers.forEach(volunteer => {
        csvContent += `"${event.eventName}","${event.description || 'N/A'}","${new Date(event.eventDate).toLocaleDateString()}","${event.location}","${event.urgency}",${event.volunteersMatched},"${volunteer.name}","${volunteer.email}","${new Date(volunteer.matchedAt).toLocaleString()}"\n`;
      });

      if (event.matchedVolunteers.length === 0) {
        csvContent += `"${event.eventName}","${event.description || 'N/A'}","${new Date(event.eventDate).toLocaleDateString()}","${event.location}","${event.urgency}",${event.volunteersMatched},"No Matched Volunteers","",""\n`;
      }
    });

    return Buffer.from(csvContent, 'utf-8');
  } catch (error) {
    console.error('Error in generateEventCSVReport:', error);
    throw error;
  }
};

//specific event
const generateSpecificEventPDFReport = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('Specific Event Report', { align: 'center' })
         .moveDown();

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text('Event: ', { continued: true })
         .font('Helvetica')
         .text(data.eventName);

      doc.moveDown(0.5);

      // Generation Date
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown(1);

      // Event Details Section
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('Description: ', { continued: true })
         .font('Helvetica')
         .text(data.description || 'N/A');

      doc.font('Helvetica-Bold')
         .text('Date: ', { continued: true })
         .font('Helvetica')
         .text(new Date(data.eventDate).toLocaleDateString());

      doc.font('Helvetica-Bold')
         .text('Location: ', { continued: true })
         .font('Helvetica')
         .text(data.location);

      doc.font('Helvetica-Bold')
         .text('Urgency: ', { continued: true })
         .font('Helvetica')
         .text(data.urgency);

      doc.font('Helvetica-Bold')
         .text('Matched Volunteers: ', { continued: true })
         .font('Helvetica')
         .text(data.volunteers.length.toString());
      doc.moveDown(1);

      // Volunteers Section
      if (data.volunteers.length > 0) {
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('Matched Volunteers')
           .moveDown();

        data.volunteers.forEach((volunteer, index) => {
          doc.fontSize(12)
             .font('Helvetica')
             .text(`Volunteer ${index + 1}`);

          doc.font('Helvetica-Bold')
             .text('Name: ', { continued: true })
             .font('Helvetica')
             .text(volunteer.name);

          doc.font('Helvetica-Bold')
             .text('Email: ', { continued: true })
             .font('Helvetica')
             .text(volunteer.email);

          doc.font('Helvetica-Bold')
             .text('Status: ', { continued: true })
             .font('Helvetica')
             .text(volunteer.status);

          doc.font('Helvetica-Bold')
             .text('Matched At: ', { continued: true })
             .font('Helvetica')
             .text(new Date(volunteer.matchedAt).toLocaleString());

          doc.moveDown(1);
        });
      } else {
        doc.fontSize(12)
           .font('Helvetica')
           .text('No matched volunteers for this event.', { align: 'left' });
      }

      doc.end();
    } catch (error) {
      console.error('Error in generateSpecificEventPDFReport:', error);
      reject(error);
    }
  });
};

const generateSpecificEventCSVReport = async (data) => {
  try {
    let csvContent = 'Event Name,Description,Date,Location,Urgency,Volunteer Name,Volunteer Email,Status,Matched At\n';

    if (data.volunteers.length > 0) {
      data.volunteers.forEach(volunteer => {
        csvContent += `"${data.eventName}","${data.description || 'N/A'}","${new Date(data.eventDate).toLocaleDateString()}","${data.location}","${data.urgency}","${volunteer.name}","${volunteer.email}","${volunteer.status}","${new Date(volunteer.matchedAt).toLocaleString()}"\n`;
      });
    } else {
      csvContent += `"${data.eventName}","${data.description || 'N/A'}","${new Date(data.eventDate).toLocaleDateString()}","${data.location}","${data.urgency}","No Matched Volunteers","","",""\n`;
    }

    return Buffer.from(csvContent, 'utf-8');
  } catch (error) {
    console.error('Error in generateSpecificEventCSVReport:', error);
    throw error;
  }
};


module.exports = reportsService;





