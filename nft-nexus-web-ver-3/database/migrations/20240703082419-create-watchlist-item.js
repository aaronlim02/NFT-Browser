'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('watchlist', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      collection_slug: {
        type: Sequelize.STRING,
        allowNull: false
      },
      collection_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      set_price: {
        type: Sequelize.FLOAT,
        allowNull: true
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('watchlist');
  }
};