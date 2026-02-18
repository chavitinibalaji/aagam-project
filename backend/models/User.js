const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatar: DataTypes.STRING(255),
    addresses: DataTypes.JSON,
    location: DataTypes.STRING(100),
  }, {
    tableName: 'users',
    timestamps: true,
  });

  User.beforeCreate(async (user) => {
    if (user.password) user.password = await bcrypt.hash(user.password, 12);
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
  });

  User.prototype.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  User.associate = (models) => {
    User.hasMany(models.Cart, { foreignKey: 'userId' });
    User.hasMany(models.Order, { foreignKey: 'userId' });
  };

  return User;
};
