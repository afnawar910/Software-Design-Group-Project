module.exports = (sequelize, DataTypes) => {
    const State = sequelize.define('State', {
        code: {
            type: DataTypes.STRING(2),
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: false
    });

    return State;
};