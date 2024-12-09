const { DataTypes } = require('sequelize');
const EventModel = require('../../../models/Event');

const mockSequelize = {
    define: jest.fn((modelName, attributes) => {
        return { name: modelName, rawAttributes: attributes, belongsTo: jest.fn() };
    }),
};

describe('Event Model', () => {
    const Event = EventModel(mockSequelize, DataTypes);

    it('should have the correct model name', () => {
        expect(Event.name).toBe('Event');
    });

    describe('Field Definitions', () => {
        it('should define id field correctly', () => {
            expect(Event.rawAttributes.id).toMatchObject({
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            });
        });

        it('should define eventName field correctly', () => {
            expect(Event.rawAttributes.eventName).toMatchObject({
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 100]
                }
            });
        });

        it('should define eventDescription field correctly', () => {
            expect(Event.rawAttributes.eventDescription).toMatchObject({
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            });
        });

        it('should define address field correctly', () => {
            expect(Event.rawAttributes.address).toMatchObject({
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            });
        });

        it('should define city field correctly', () => {
            expect(Event.rawAttributes.city).toMatchObject({
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true
                }
            });
        });

        it('should define state field correctly', () => {
            expect(Event.rawAttributes.state).toMatchObject({
                type: DataTypes.STRING(2),
                allowNull: false,
                references: {
                    model: 'States',
                    key: 'code'
                }
            });
        });

        it('should define zipCode field correctly', () => {
            expect(Event.rawAttributes.zipCode).toMatchObject({
                type: DataTypes.STRING(10),
                allowNull: false,
                validate: {
                    notEmpty: true,
                    is: /^\d{5}(-\d{4})?$/
                }
            });
        });

        it('should define requiredSkills field correctly', () => {
            expect(Event.rawAttributes.requiredSkills).toMatchObject({
                type: DataTypes.ARRAY(DataTypes.STRING),
                allowNull: false,
                defaultValue: [],
                validate: {
                    notEmpty: true
                }
            });
        });

        it('should define urgency field correctly', () => {
            expect(Event.rawAttributes.urgency).toMatchObject({
                type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
                allowNull: false
            });
        });

        it('should define eventDate field correctly', () => {
            expect(Event.rawAttributes.eventDate).toMatchObject({
                type: DataTypes.DATEONLY,
                allowNull: false
            });
        });

        it('should define startTime field correctly', () => {
            expect(Event.rawAttributes.startTime).toMatchObject({
                type: DataTypes.TIME,
                allowNull: false
            });
        });

        it('should define endTime field correctly', () => {
            expect(Event.rawAttributes.endTime).toMatchObject({
                type: DataTypes.TIME,
                allowNull: false
            });
        });

        it('should define createdBy field correctly', () => {
            expect(Event.rawAttributes.createdBy).toMatchObject({
                type: DataTypes.INTEGER,
                allowNull: false
            });
        });
    });

    describe('Associations', () => {
        const State = { name: 'State' };
        const User = { name: 'User' };

        beforeAll(() => {
            Event.associate({ State, User });
        });

        it('should belong to State', () => {
            expect(Event.belongsTo).toHaveBeenCalledWith(State, {
                foreignKey: 'state',
                targetKey: 'code'
            });
        });

        it('should belong to User', () => {
            expect(Event.belongsTo).toHaveBeenCalledWith(User, {
                foreignKey: 'createdBy'
            });
        });
    });
});

