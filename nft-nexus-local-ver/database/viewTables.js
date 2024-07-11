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

async function viewTables() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Fetch all users
    const users = await User.findAll();
    console.log('Users:', JSON.stringify(users, null, 2));

    // Fetch all settings
    const settings = await Setting.findAll();
    console.log('Settings:', JSON.stringify(settings, null, 2));

    // Fetch all watchlist items
    const watchlist = await Watchlist_item.findAll();
    console.log('Watchlist:', JSON.stringify(watchlist, null, 2));

    const notifications = await Notification_item.findAll();
    console.log('Notifications:', JSON.stringify(notifications, null, 2));

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }

}

viewTables();