module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Exam",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: { type: DataTypes.INTEGER, allowNull: false },
      teacher_id: { type: DataTypes.INTEGER, allowNull: false },
      requirement: { type: DataTypes.TEXT, allowNull: false },
      start_date: { type: DataTypes.DATE, allowNull: false },
      end_date: { type: DataTypes.DATE, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      group_id: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      response: {
        type: DataTypes.TEXT,
        allowNull: true, // poate fi null până când studentul răspunde
      },
      grade: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
    },
    {
      tableName: "exams",
      timestamps: false,
    }
  );
};
