module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Group",
    {
      nume_grupa: { type: DataTypes.STRING },
      teacher_id: { type: DataTypes.INTEGER }, // FK către Teacher
    },
    {
      tableName: "groups", // respectă majuscula din SQL
      timestamps: false,
    }
  );
};
