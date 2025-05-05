const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: 5433,
    dialect: "postgres",
  }
);

// Import modele
const Student = require("./student")(sequelize, DataTypes);
const Teacher = require("./teacher")(sequelize, DataTypes);
const Group = require("./group")(sequelize, DataTypes);
const Exam = require("./exam")(sequelize, DataTypes);

// Un profesor are mai multe grupe
Teacher.hasMany(Group, { foreignKey: "teacher_id" });
Group.belongsTo(Teacher, { foreignKey: "teacher_id" });

// O grupă are mai mulți studenți
Group.hasMany(Student, { foreignKey: "group_id" });
Student.belongsTo(Group, { foreignKey: "group_id" });

// (Opțional) Dacă vrei și: un profesor are mai mulți studenți direct:
Teacher.hasMany(Student, { foreignKey: "teacher_id" });
Student.belongsTo(Teacher, { foreignKey: "teacher_id" });

// Exam aparține unui Student
Student.hasMany(Exam, { foreignKey: "student_id" });
Exam.belongsTo(Student, { foreignKey: "student_id" });

// Exam aparține unui Teacher
Teacher.hasMany(Exam, { foreignKey: "teacher_id" });
Exam.belongsTo(Teacher, { foreignKey: "teacher_id" });

Group.hasMany(Exam, { foreignKey: "group_id" });
Exam.belongsTo(Group, { foreignKey: "group_id" });

module.exports = {
  sequelize,
  Student,
  Teacher,
  Group,
  Exam,
};
