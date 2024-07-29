'use strict';

module.exports = (sequelize, DataTypes) => {
  const Gallery = sequelize.define('Gallery', {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'galleries'
  });

  Gallery.associate = function(models) {
    Gallery.belongsTo(models.User, { foreignKey: 'user_id' });
    Gallery.hasMany(models.GalleryItem, { foreignKey: 'gallery_id' });
  };

  return Gallery;
};