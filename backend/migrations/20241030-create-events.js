module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('Events', {
          id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true
          },
          eventName: {
              type: Sequelize.STRING(100),
              allowNull: false
          },
          eventDescription: {
              type: Sequelize.TEXT,
              allowNull: false
          },
          address: {
              type: Sequelize.TEXT,
              allowNull: false
          },
          city: {
              type: Sequelize.STRING,
              allowNull: false
          },
          state: {
              type: Sequelize.STRING(2),
              allowNull: false,
              references: {
                  model: 'States',
                  key: 'code'
              }
          },
          zipCode: {
              type: Sequelize.STRING(10),
              allowNull: false
          },
          requiredSkills: {
              type: Sequelize.ARRAY(Sequelize.STRING),
              allowNull: false,
              defaultValue: []
          },
          urgency: {
              type: Sequelize.ENUM('Low', 'Medium', 'High', 'Critical'),
              allowNull: false
          },
          eventDate: {
              type: Sequelize.DATEONLY,
              allowNull: false
          },
          startTime: {
              type: Sequelize.TIME,
              allowNull: false
          },
          endTime: {
              type: Sequelize.TIME,
              allowNull: false
          },
          createdBy: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                  model: 'Users',
                  key: 'id'
              }
          },
          createdAt: {
              type: Sequelize.DATE,
              allowNull: false
          },
          updatedAt: {
              type: Sequelize.DATE,
              allowNull: false
          }
      });
  },
  down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable('Events');
  }
};