const { Sequelize, DataTypes } = require('sequelize');

describe('Event Model', () => {
    let sequelize;
    let Event;

    beforeAll(() => {
        sequelize = new Sequelize('sqlite::memory:', {
            logging: false
        });

        Event = sequelize.define('Event', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            eventName: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100]
                }
            },
            eventDescription: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            address: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            city: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            },
            state: {
                type: DataTypes.STRING(2),
                allowNull: false
            },
            zipCode: {
                type: DataTypes.STRING(10),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    is: /^\d{5}(-\d{4})?$/
                }
            },
            requiredSkills: {
                type: DataTypes.TEXT,
                allowNull: false,
                defaultValue: '[]',
                get() {
                    const rawValue = this.getDataValue('requiredSkills');
                    return JSON.parse(rawValue);
                },
                set(value) {
                    this.setDataValue('requiredSkills', JSON.stringify(value));
                },
                validate: {
                    isValidArray(value) {
                        try {
                            const arr = JSON.parse(value);
                            if (!Array.isArray(arr) || arr.length === 0) {
                                throw new Error('Required skills must be a non-empty array');
                            }
                        } catch (e) {
                            throw new Error('Invalid skills format');
                        }
                    }
                }
            },
            urgency: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['Low', 'Medium', 'High', 'Critical']]
                }
            },
            eventDate: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            startTime: {
                type: DataTypes.TIME,
                allowNull: false
            },
            endTime: {
                type: DataTypes.TIME,
                allowNull: false
            },
            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        });

        const User = sequelize.define('User', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            }
        });

        const State = sequelize.define('State', {
            code: {
                type: DataTypes.STRING(2),
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            }
        });

        Event.belongsTo(User, {
            foreignKey: 'createdBy'
        });

        Event.belongsTo(State, {
            foreignKey: 'state',
            targetKey: 'code'
        });
    });

    beforeEach(async () => {
        await sequelize.sync({ force: true });

        await sequelize.models.User.create({
            id: 1,
            email: 'test@example.com'
        });

        await sequelize.models.State.create({
            code: 'CA',
            name: 'California'
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    const validEventData = {
        eventName: 'Test Event',
        eventDescription: 'Test Description',
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        requiredSkills: ['skill1', 'skill2'],
        urgency: 'Medium',
        eventDate: '2024-12-25',
        startTime: '09:00:00',
        endTime: '17:00:00',
        createdBy: 1
    };

    describe('Model Structure', () => {
        it('should have all required fields', () => {
            const fields = Object.keys(Event.rawAttributes);
            const requiredFields = [
                'id', 'eventName', 'eventDescription', 'address',
                'city', 'state', 'zipCode', 'requiredSkills',
                'urgency', 'eventDate', 'startTime', 'endTime',
                'createdBy'
            ];

            requiredFields.forEach(field => {
                expect(fields).toContain(field);
            });
        });

        it('should have correct associations', () => {
            expect(Event.associations.User).toBeDefined();
            expect(Event.associations.State).toBeDefined();
        });
    });

    describe('Validations', () => {
        it('should create event with valid data', async () => {
            const event = await Event.create(validEventData);
            expect(event).toBeDefined();
            expect(event.eventName).toBe(validEventData.eventName);
            expect(Array.isArray(event.requiredSkills)).toBe(true);
        });

        it('should enforce eventName length validation', async () => {
            const invalidEvent = { ...validEventData, eventName: 'a'.repeat(101) };
            await expect(Event.create(invalidEvent)).rejects.toThrow();
        });

        it('should enforce zipCode format', async () => {
            const invalidEvent = { ...validEventData, zipCode: '123' };
            await expect(Event.create(invalidEvent)).rejects.toThrow();

            const validZipEvent = { ...validEventData, zipCode: '12345-6789' };
            const event = await Event.create(validZipEvent);
            expect(event.zipCode).toBe('12345-6789');
        });

        it('should enforce urgency values', async () => {
            const invalidEvent = { ...validEventData, urgency: 'Invalid' };
            await expect(Event.create(invalidEvent)).rejects.toThrow();

            const validUrgencies = ['Low', 'Medium', 'High', 'Critical'];
            for (const urgency of validUrgencies) {
                const event = await Event.create({ ...validEventData, urgency });
                expect(event.urgency).toBe(urgency);
            }
        });

        it('should validate required skills array', async () => {
            const invalidEvent = { ...validEventData, requiredSkills: [] };
            await expect(Event.create(invalidEvent)).rejects.toThrow();
        });
    });

    describe('CRUD Operations', () => {
        it('should handle create, read, update, and delete operations', async () => {
            const event = await Event.create(validEventData);
            expect(event.id).toBeDefined();

            const foundEvent = await Event.findByPk(event.id);
            expect(foundEvent.eventName).toBe(validEventData.eventName);

            const updatedName = 'Updated Event Name';
            await event.update({ eventName: updatedName });
            expect(event.eventName).toBe(updatedName);

            await event.destroy();
            const deletedEvent = await Event.findByPk(event.id);
            expect(deletedEvent).toBeNull();
        });
    });
});