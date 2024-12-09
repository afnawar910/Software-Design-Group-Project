module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('Profiles', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                unique: true,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            fullName: {
                type: Sequelize.STRING,
                allowNull: false
            },
            address1: {
                type: Sequelize.STRING,
                allowNull: false
            },
            address2: {
                type: Sequelize.STRING,
                allowNull: true
            },
            city: {
                type: Sequelize.STRING,
                allowNull: false
            },
            state: {
                type: Sequelize.STRING(2),
                allowNull: false
            },
            zipCode: {
                type: Sequelize.STRING,
                allowNull: false
            },
            skills: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: false
            },
            preferences: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            availability: {
                type: Sequelize.ARRAY(Sequelize.DATE),
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('Profiles');
    }
};