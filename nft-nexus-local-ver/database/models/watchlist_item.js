'use strict';

module.exports = (sequelize, DataTypes) => {
  const Watchlist_item = sequelize.define('Watchlist_item', {
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
    contract_addr: {
      type: DataTypes.STRING,
      allowNull: false
    },
    set_price: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'watchlist'
  });

  Watchlist_item.associate = function(models) {
    Watchlist_item.belongsTo(models.User, { foreignKey: 'user_id' });
  };

  return Watchlist_item;
};