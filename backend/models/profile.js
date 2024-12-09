'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Profile extends Model {
        static associate(models) {
            Profile.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'User',
                onDelete: 'CASCADE'
            });
            Profile.belongsTo(models.State, {
                foreignKey: 'state',
                targetKey: 'code',
                as: 'stateDetails'
            });
        }
    }

    Profile.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address1: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address2: {
            type: DataTypes.STRING,
            allowNull: true
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
        },
        state: {
            type: DataTypes.STRING(2),
            allowNull: true,
            references: {
                model: 'States',
                key: 'code'
            }
        },
        zipCode: {
            type: DataTypes.STRING,
            allowNull: true
        },
        skills: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [] 
        },
        preferences: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        availability: {
            type: DataTypes.ARRAY(DataTypes.DATE),
            allowNull: true,
            defaultValue: []
        }
    }, {
        sequelize,
        modelName: 'Profile'
    });

    return Profile;
};