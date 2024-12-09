const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

describe('States Migration and Seeding', () => {
    let sequelize;
    let queryInterface;
    let StateModel; 

    beforeEach(async () => {
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false
        });

        queryInterface = sequelize.getQueryInterface();

        await queryInterface.createTable('States', {
            code: {
                type: DataTypes.STRING(2),
                allowNull: false,
                unique: true,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            }
        });

        StateModel = sequelize.define('States', {
            code: {
                type: DataTypes.STRING(2),
                primaryKey: true,
                allowNull: false,
                validate: {
                    len: [2, 2]
                }
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            }
        }, {
            tableName: 'States',
            timestamps: false
        });
    });

    afterEach(async () => {
        await queryInterface.dropTable('States', { force: true });
        await sequelize.close();
    });

    describe('Edge Cases', () => {
        it('should handle special characters in state names', async () => {
            const specialState = {
                code: 'SP',
                name: "State's Name with 'Special' Characters!"
            };

            await queryInterface.bulkInsert('States', [specialState]);
            
            const [states] = await sequelize.query(
                "SELECT * FROM States WHERE code = 'SP'"
            );
            
            expect(states[0].name).toBe(specialState.name);
        });

        it('should enforce state code length', async () => {
            const longCode = {
                code: 'ABC',
                name: 'Invalid State Long'
            };
            await expect(StateModel.create(longCode)).rejects.toThrow(/Validation error/);

            const shortCode = {
                code: 'A',
                name: 'Invalid State Short'
            };
            await expect(StateModel.create(shortCode)).rejects.toThrow(/Validation error/);

            const validCode = {
                code: 'XY',
                name: 'Valid State'
            };
            const validState = await StateModel.create(validCode);
            expect(validState.code).toBe('XY');
        });
    });
});