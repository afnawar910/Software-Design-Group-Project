module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addConstraint('VolunteerHistories', {
            fields: ['volunteerId', 'eventId'],
            type: 'unique',
            name: 'volunteer_event_unique'
        });

        const [volunteers] = await queryInterface.sequelize.query(
            `SELECT id FROM "Users" WHERE role = 'volunteer'`
        );
        const [events] = await queryInterface.sequelize.query(
            `SELECT id FROM "Events"`
        );

        const records = [];
        for (const volunteer of volunteers) {
            for (const event of events) {
                records.push({
                    volunteerId: volunteer.id,
                    eventId: event.id,
                    participationStatus: 'Not Attended',
                    matchedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        if (records.length > 0) {
            await queryInterface.bulkInsert('VolunteerHistories', records, {
                ignoreDuplicates: true
            });
        }
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeConstraint(
            'VolunteerHistories', 
            'volunteer_event_unique'
        );
    }
};