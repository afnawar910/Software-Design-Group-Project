module.exports = (sequelize, DataTypes) => {
    const VolunteerHistory = sequelize.define('VolunteerHistory', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        volunteerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        eventId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Events',
                key: 'id'
            }
        },
        participationStatus: {
            type: DataTypes.STRING,
            defaultValue: 'Not Attended',
            allowNull: false
        },
        matchedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['volunteerId', 'eventId']
            }
        ]
    });

    VolunteerHistory.associate = (models) => {
        VolunteerHistory.belongsTo(models.User, { 
            foreignKey: 'volunteerId',
            onDelete: 'CASCADE' 
        });
        VolunteerHistory.belongsTo(models.Event, { 
            foreignKey: 'eventId',
            onDelete: 'CASCADE' 
        });
    };
    

    return VolunteerHistory;
};