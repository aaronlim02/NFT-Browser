const sequelize = require('./sequelize');
const User = require('./models/user')(sequelize, require('sequelize').DataTypes);
const Setting = require('./models/setting')(sequelize, require('sequelize').DataTypes);
const Watchlist_item = require('./models/watchlist_item')(sequelize, require('sequelize').DataTypes);
const Notification_item = require('./models/notification_item')(sequelize, require('sequelize').DataTypes);
const Gallery = require('./models/galleries_item')(sequelize, require('sequelize').DataTypes);
const Gallery_item = require('./models/gallery_item')(sequelize, require('sequelize').DataTypes);

// Define relationships
User.hasMany(Setting, { foreignKey: 'user_id' });
Setting.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Watchlist_item, { foreignKey: 'user_id' });
Watchlist_item.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification_item, { foreignKey: 'user_id' });
Notification_item.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Gallery, { foreignKey: 'user_id' });
Gallery.belongsTo(User, { foreignKey: 'user_id' });
Gallery.hasMany(Gallery_item, { foreignKey: 'gallery_id' });
Gallery_item.belongsTo(Gallery, { foreignKey: 'gallery_id' });

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

    // Fetch all notifications items
    const notifications = await Notification_item.findAll();
    console.log('Notifications:', JSON.stringify(notifications, null, 2));

    // Fetch all notifications items
    const gallery = await Gallery.findAll();
    console.log('Galleries:', JSON.stringify(gallery, null, 2));

    // Fetch all notifications items
    const gallery_items = await Gallery_item.findAll();
    console.log('Gallery items:', JSON.stringify(gallery_items, null, 2));

  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }

}

viewTables();