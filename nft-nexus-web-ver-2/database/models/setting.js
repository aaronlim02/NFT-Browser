'use strict';

module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    setting_key: {
      type: DataTypes.STRING,
      allowNull: false
    },
    setting_value: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    timestamps: false,
    tableName: 'settings'
  });

  Setting.associate = function(models) {
    Setting.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Setting;
};