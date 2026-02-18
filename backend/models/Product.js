const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    price: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    mrp: DataTypes.STRING(50),
    off: DataTypes.STRING(50),
    weight: DataTypes.STRING(50),
    img: DataTypes.STRING(500),
    cat: DataTypes.STRING(50),
    highlights: DataTypes.JSON,
    deliveryTime: DataTypes.STRING(50),
    tags: DataTypes.JSON,
  }, {
    tableName: 'products',
    timestamps: true,
  });

  return Product;
};
