const sequelize = require('./sequelize');
const User = require('./models/user')(sequelize, require('sequelize').DataTypes);
const Setting = require('./models/setting')(sequelize, require('sequelize').DataTypes);
const Watchlist_item = require('./models/watchlist_item')(sequelize, require('sequelize').DataTypes);
const Notification_item = require('./models/notification_item')(sequelize, require('sequelize').DataTypes);

// Define relationships
User.hasMany(Setting, { foreignKey: 'user_id' });
Setting.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Watchlist_item, { foreignKey: 'user_id' });
Watchlist_item.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification_item, { foreignKey: 'user_id' });
Notification_item.belongsTo(User, { foreignKey: 'user_id' });

async function syncDatabase() {
  try {
    await sequelize.sync({ force: true }); // Use { force: true } to drop and recreate tables
    console.log('Database synced!');
  } catch (error) {
    console.error('Failed to sync database:', error);
  }
}

syncDatabase();