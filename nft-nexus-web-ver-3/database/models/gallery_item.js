'use strict';

module.exports = (sequelize, DataTypes) => {
  const GalleryItem = sequelize.define('GalleryItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    gallery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'galleries',
        key: 'id'
      }
    },
    contract_addr: {
      type: DataTypes.STRING,
      allowNull: false
    },
    token_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    collection_name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'gallery_items'
  });

  GalleryItem.associate = function(models) {
    GalleryItem.belongsTo(models.Gallery, { foreignKey: 'gallery_id' });
  };

  return GalleryItem;
};