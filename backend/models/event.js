// module.exports = (sequelize, DataTypes) => {
//   const Event = sequelize.define('Event', {
//       id: {
//           type: DataTypes.INTEGER,
//           primaryKey: true,
//           autoIncrement: true
//       },
//       eventName: {
//           type: DataTypes.STRING(100),
//           allowNull: false,
//           validate: {
//               notEmpty: true,
//               len: [1, 100]
//           }
//       },
//       eventDescription: {
//           type: DataTypes.TEXT,
//           allowNull: false,
//           validate: {
//               notEmpty: true
//           }
//       },
//       address: {
//           type: DataTypes.TEXT,
//           allowNull: false,
//           validate: {
//               notEmpty: true
//           }
//       },
//       city: {
//           type: DataTypes.STRING,
//           allowNull: false,
//           validate: {
//               notEmpty: true
//           }
//       },
//       state: {
//           type: DataTypes.STRING(2),
//           allowNull: false,
//           references: {
//               model: 'States',
//               key: 'code'
//           }
//       },
//       zipCode: {
//           type: DataTypes.STRING(10),
//           allowNull: false,
//           validate: {
//               notEmpty: true,
//               is: /^\d{5}(-\d{4})?$/
//           }
//       },
//       requiredSkills: {
//           type: DataTypes.ARRAY(DataTypes.STRING),
//           allowNull: false,
//           defaultValue: [],
//           validate: {
//               notEmpty: true
//           }
//       },
//       urgency: {
//           type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
//           allowNull: false
//       },
//       eventDate: {
//           type: DataTypes.DATEONLY,
//           allowNull: false
//       },
//       startTime: {
//           type: DataTypes.TIME,
//           allowNull: false
//       },
//       endTime: {
//           type: DataTypes.TIME,
//           allowNull: false
//       },
//       createdBy: {
//           type: DataTypes.INTEGER,
//           allowNull: false
//       }
//   });

//   Event.associate = (models) => {
//       Event.belongsTo(models.State, {
//           foreignKey: 'state',
//           targetKey: 'code'
//       });
//       Event.belongsTo(models.User, {
//           foreignKey: 'createdBy'
//       });
//   };
   

//   return Event;
// };
module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
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
            allowNull: false,
            references: {
                model: 'States',
                key: 'code'
            }
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
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: false,
            defaultValue: [],
            validate: {
                notEmpty: true
            }
        },
        urgency: {
            type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
            allowNull: false
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

    // Associate function to define relationships
    Event.associate = (models) => {
        // Association with State
        Event.belongsTo(models.State, {
            foreignKey: 'state',
            targetKey: 'code'
        });

        // Association with User (Creator)
        Event.belongsTo(models.User, {
            foreignKey: 'createdBy'
        });

        // Association with VolunteerHistory
        Event.hasMany(models.VolunteerHistory, {
            foreignKey: 'eventId',  // Matches the foreign key in VolunteerHistory
            as: 'VolunteerHistories', // Alias for easier access
            onDelete: 'CASCADE'
        });
    };

    return Event;
};

