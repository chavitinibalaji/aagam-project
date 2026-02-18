const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('processing', 'out_for_delivery', 'delivered', 'cancelled'),
      defaultValue: 'processing',
    },
    timeline: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    paymentId: DataTypes.STRING(100),
    paymentStatus: DataTypes.STRING(50),
  }, {
    tableName: 'orders',
    timestamps: true,
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return Order;
};
