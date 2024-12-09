const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Create admin user
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      const adminUser = await queryInterface.bulkInsert('Users', [{
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isRegistered: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }], { returning: true });

      // Create admin profile
      await queryInterface.bulkInsert('Profiles', [{
        userId: adminUser[0].id,
        fullName: 'System Administrator',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    } catch (error) {
      console.error('Error seeding admin:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const adminUser = await queryInterface.sequelize.query(
        `SELECT id FROM "Users" WHERE email = 'admin@example.com'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (adminUser[0]) {
        await queryInterface.bulkDelete('Profiles', { userId: adminUser[0].id });
        await queryInterface.bulkDelete('Users', { id: adminUser[0].id });
      }
    } catch (error) {
      console.error('Error removing admin:', error);
    }
  }
};