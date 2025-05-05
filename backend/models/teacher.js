module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Teacher",
    {
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.TEXT, allowNull: false },
    },
    {
      tableName: "teachers", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not used
    }
  );
};
