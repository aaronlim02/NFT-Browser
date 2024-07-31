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
    collection_slug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    collection_name: {
      type: DataTypes.STRING,
      allowNull: true
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