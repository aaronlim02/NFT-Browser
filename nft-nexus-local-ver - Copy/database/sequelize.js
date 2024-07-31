const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/database.sqlite', // Path to your SQLite database file
});

module.exports = sequelize;