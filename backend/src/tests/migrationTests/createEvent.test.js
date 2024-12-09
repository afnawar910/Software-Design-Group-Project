// const { Sequelize } = require('sequelize');

// // Mocking the migration file content
// const createEventMigration = {
//     up: async (queryInterface, Sequelize) => {
//         await queryInterface.createTable('Events', {
//             id: {
//                 type: Sequelize.INTEGER,
//                 primaryKey: true,
//                 autoIncrement: true
//             },
//             eventName: {
//                 type: Sequelize.STRING(100),
//                 allowNull: false
//             },
//             eventDescription: {
//                 type: Sequelize.TEXT,
//                 allowNull: false
//             },
//             address: {
//                 type: Sequelize.TEXT,
//                 allowNull: false
//             },
//             city: {
//                 type: Sequelize.STRING,
//                 allowNull: false
//             },
//             state: {
//                 type: Sequelize.STRING(2),
//                 allowNull: false,
//                 references: {
//                     model: 'States',
//                     key: 'code'
//                 }
//             },
//             zipCode: {
//                 type: Sequelize.STRING(10),
//                 allowNull: false
//             },
//             requiredSkills: {
//                 type: Sequelize.ARRAY(Sequelize.STRING),
//                 allowNull: false,
//                 defaultValue: []
//             },
//             urgency: {
//                 type: Sequelize.ENUM('Low', 'Medium', 'High', 'Critical'),
//                 allowNull: false
//             },
//             eventDate: {
//                 type: Sequelize.DATEONLY,
//                 allowNull: false
//             },
//             startTime: {
//                 type: Sequelize.TIME,
//                 allowNull: false
//             },
//             endTime: {
//                 type: Sequelize.TIME,
//                 allowNull: false
//             },
//             createdBy: {
//                 type: Sequelize.INTEGER,
//                 allowNull: false,
//                 references: {
//                     model: 'Users',
//                     key: 'id'
//                 }
//             },
//             createdAt: {
//                 type: Sequelize.DATE,
//                 allowNull: false
//             },
//             updatedAt: {
//                 type: Sequelize.DATE,
//                 allowNull: false
//             }
//         });
//     },
//     down: async (queryInterface, Sequelize) => {
//         await queryInterface.dropTable('Events');
//     }
// };

// describe('Event Migration', () => {
//     let queryInterface;
//     let sequelize;

//     beforeEach(() => {
//         sequelize = new Sequelize('sqlite::memory:');
//         queryInterface = sequelize.getQueryInterface();
//         jest.spyOn(queryInterface, 'createTable').mockImplementation(() => Promise.resolve());
//         jest.spyOn(queryInterface, 'dropTable').mockImplementation(() => Promise.resolve());
//     });

//     afterEach(() => {
//         jest.clearAllMocks();
//     });

//     describe('up migration', () => {
//         it('should create Events table with correct columns and types', async () => {
//             await createEventMigration.up(queryInterface, Sequelize);

//             expect(queryInterface.createTable).toHaveBeenCalledTimes(1);
//             const [tableName, columns] = queryInterface.createTable.mock.calls[0];
            
//             // Check table name
//             expect(tableName).toBe('Events');

//             // Check individual column definitions instead of the entire object
//             expect(columns.id.type).toBe(Sequelize.INTEGER);
//             expect(columns.id.primaryKey).toBe(true);
//             expect(columns.id.autoIncrement).toBe(true);

//             expect(columns.eventName.type).toBeInstanceOf(Sequelize.STRING);
//             expect(columns.eventName.type._length).toBe(100);
//             expect(columns.eventName.allowNull).toBe(false);

//             expect(columns.eventDescription.type).toBe(Sequelize.TEXT);
//             expect(columns.eventDescription.allowNull).toBe(false);

//             expect(columns.requiredSkills.type).toBeInstanceOf(Sequelize.ARRAY);
//             expect(columns.requiredSkills.allowNull).toBe(false);
//             expect(columns.requiredSkills.defaultValue).toEqual([]);

//             expect(columns.urgency.type).toBeInstanceOf(Sequelize.ENUM);
//             expect(columns.urgency.type.values).toEqual(['Low', 'Medium', 'High', 'Critical']);
//             expect(columns.urgency.allowNull).toBe(false);
//         });

//         it('should enforce correct foreign key constraints', async () => {
//             await createEventMigration.up(queryInterface, Sequelize);

//             const [, columns] = queryInterface.createTable.mock.calls[0];

//             expect(columns.state.references).toEqual({
//                 model: 'States',
//                 key: 'code'
//             });

//             expect(columns.createdBy.references).toEqual({
//                 model: 'Users',
//                 key: 'id'
//             });
//         });

//         it('should set correct ENUM values for urgency', async () => {
//             await createEventMigration.up(queryInterface, Sequelize);

//             const [, columns] = queryInterface.createTable.mock.calls[0];
            
//             expect(columns.urgency.type).toBeInstanceOf(Sequelize.ENUM);
//             expect(columns.urgency.type.values).toEqual([
//                 'Low',
//                 'Medium',
//                 'High',
//                 'Critical'
//             ]);
//         });
//     });

//     describe('down migration', () => {
//         it('should drop the Events table', async () => {
//             await createEventMigration.down(queryInterface, Sequelize);

//             expect(queryInterface.dropTable).toHaveBeenCalledTimes(1);
//             expect(queryInterface.dropTable).toHaveBeenCalledWith('Events');
//         });
//     });

//     describe('error handling', () => {
//         it('should handle errors when creating table', async () => {
//             queryInterface.createTable.mockRejectedValue(new Error('Database error'));

//             await expect(createEventMigration.up(queryInterface, Sequelize))
//                 .rejects
//                 .toThrow('Database error');
//         });

//         it('should handle errors when dropping table', async () => {
//             queryInterface.dropTable.mockRejectedValue(new Error('Database error'));

//             await expect(createEventMigration.down(queryInterface, Sequelize))
//                 .rejects
//                 .toThrow('Database error');
//         });
//     });
// });

const { Sequelize } = require('sequelize');
const createEventMigration = require('../../../migrations/20241030-create-events.js');

describe('Event Migration', () => {
    let queryInterface;
    let sequelize;

    beforeEach(() => {
        sequelize = new Sequelize('sqlite::memory:');
        queryInterface = sequelize.getQueryInterface();
        jest.spyOn(queryInterface, 'createTable').mockImplementation(() => Promise.resolve());
        jest.spyOn(queryInterface, 'dropTable').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('up migration', () => {
        it('should create Events table with correct columns and types', async () => {
            await createEventMigration.up(queryInterface, Sequelize);

            expect(queryInterface.createTable).toHaveBeenCalledTimes(1);
            const [tableName, columns] = queryInterface.createTable.mock.calls[0];
            
            // Check table name
            expect(tableName).toBe('Events');

            // Check individual column definitions
            expect(columns.id.type).toBe(Sequelize.INTEGER);
            expect(columns.id.primaryKey).toBe(true);
            expect(columns.id.autoIncrement).toBe(true);

            expect(columns.eventName.type).toBeInstanceOf(Sequelize.STRING);
            expect(columns.eventName.type._length).toBe(100);
            expect(columns.eventName.allowNull).toBe(false);

            expect(columns.eventDescription.type).toBe(Sequelize.TEXT);
            expect(columns.eventDescription.allowNull).toBe(false);

            expect(columns.requiredSkills.type).toBeInstanceOf(Sequelize.ARRAY);
            expect(columns.requiredSkills.allowNull).toBe(false);
            expect(columns.requiredSkills.defaultValue).toEqual([]);

            expect(columns.urgency.type).toBeInstanceOf(Sequelize.ENUM);
            expect(columns.urgency.type.values).toEqual(['Low', 'Medium', 'High', 'Critical']);
            expect(columns.urgency.allowNull).toBe(false);
        });

        it('should enforce correct foreign key constraints', async () => {
            await createEventMigration.up(queryInterface, Sequelize);

            const [, columns] = queryInterface.createTable.mock.calls[0];

            expect(columns.state.references).toEqual({
                model: 'States',
                key: 'code'
            });

            expect(columns.createdBy.references).toEqual({
                model: 'Users',
                key: 'id'
            });
        });

        it('should set correct ENUM values for urgency', async () => {
            await createEventMigration.up(queryInterface, Sequelize);

            const [, columns] = queryInterface.createTable.mock.calls[0];
            
            expect(columns.urgency.type).toBeInstanceOf(Sequelize.ENUM);
            expect(columns.urgency.type.values).toEqual([
                'Low',
                'Medium',
                'High',
                'Critical'
            ]);
        });
    });

    describe('down migration', () => {
        it('should drop the Events table', async () => {
            await createEventMigration.down(queryInterface, Sequelize);

            expect(queryInterface.dropTable).toHaveBeenCalledTimes(1);
            expect(queryInterface.dropTable).toHaveBeenCalledWith('Events');
        });
    });

    describe('error handling', () => {
        it('should handle errors when creating table', async () => {
            queryInterface.createTable.mockRejectedValue(new Error('Database error'));

            await expect(createEventMigration.up(queryInterface, Sequelize))
                .rejects
                .toThrow('Database error');
        });

        it('should handle errors when dropping table', async () => {
            queryInterface.dropTable.mockRejectedValue(new Error('Database error'));

            await expect(createEventMigration.down(queryInterface, Sequelize))
                .rejects
                .toThrow('Database error');
        });
    });
});