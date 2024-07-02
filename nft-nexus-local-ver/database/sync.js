const sequelize = require('./sequelize');
const User = require('./models/user')(sequelize, require('sequelize').DataTypes);
const Setting = require('./models/setting')(sequelize, require('sequelize').DataTypes);

// Define relationships
User.hasMany(Setting, { foreignKey: 'user_id' });
Setting.belongsTo(User, { foreignKey: 'user_id' });

async function syncDatabase() {
  try {
    await sequelize.sync({ force: true }); // Use { force: true } to drop and recreate tables
    console.log('Database synced!');
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
}

syncDatabase();