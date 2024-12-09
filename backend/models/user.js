// 'use strict';
// const { Model } = require('sequelize');
// const bcrypt = require('bcryptjs');

// module.exports = (sequelize, DataTypes) => {
//     class User extends Model {
//         static associate(models) {
//             // Define associations here
//             User.hasOne(models.Profile, {
//                 foreignKey: 'userId',
//                 as: 'Profile',
//                 onDelete: 'CASCADE'
//             });
//             User.hasMany(models.VolunteerHistory, {
//                 foreignKey: 'volunteerId',
//                 as: 'VolunteerHistories'
//             });
//         }

//         async validatePassword(password) {
//             return bcrypt.compare(password, this.password);
//         }
//     }

//     User.init({
//         email: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             unique: true,
//             validate: {
//                 isEmail: true
//             }
//         },
//         password: {
//             type: DataTypes.STRING,
//             allowNull: false
//         },
//         role: {
//             type: DataTypes.ENUM('admin', 'volunteer'),
//             defaultValue: 'volunteer'
//         },
//         isRegistered: {
//             type: DataTypes.BOOLEAN,
//             defaultValue: false
//         },
//         registrationToken: {
//             type: DataTypes.STRING,
//             allowNull: true
//         },
//         tokenExpiresAt: {
//             type: DataTypes.DATE,
//             allowNull: true
//         }
//     }, {
//         sequelize,
//         modelName: 'User'
//     });

//     return User;
// };

'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasOne(models.Profile, {
                foreignKey: 'userId',
                as: 'Profile',
                onDelete: 'CASCADE'
            });
            User.hasMany(models.VolunteerHistory, {
                foreignKey: 'volunteerId',
                as: 'VolunteerHistories'
            });
        }

        async validatePassword(password) {
            return bcrypt.compare(password, this.password);
        }
    }

    User.init({
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'volunteer'),
            defaultValue: 'volunteer'
        },
        isRegistered: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        registrationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tokenExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        },
        sequelize,
        modelName: 'User'
    });

    return User;
};