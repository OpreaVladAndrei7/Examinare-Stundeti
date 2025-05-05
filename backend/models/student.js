const { DataTypes } = require("sequelize");
const { sequelize } = require(".");

module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Student",
    {
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.TEXT, allowNull: false },
      teacher_id: { type: DataTypes.INTEGER, allowNull: false },
      group_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "students", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not used
    }
  );
};
