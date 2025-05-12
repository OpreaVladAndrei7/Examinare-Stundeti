require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { Op } = require("sequelize");
//const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt"); // For password hashing
const jwt = require("jsonwebtoken");
const { sequelize, Student, Teacher, Group, Exam } = require("./models");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

// Test the database connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

//Modifing the password to be crypted in the database for the cases when it is insterted directly
// Function to hash passwords for students
// const updateStudentPasswords = async () => {
//   const students = await Student.findAll();
//   for (const student of students) {
//     const hashedPassword = await bcrypt.hash(student.password, 10);
//     await Student.update(
//       { password: hashedPassword },
//       { where: { id: student.id } }
//     );
//   }
//   console.log("Student passwords updated successfully!");
// };

// // Function to hash passwords for teachers
// const updateTeacherPasswords = async () => {
//   const teachers = await Teacher.findAll();
//   for (const teacher of teachers) {
//     const hashedPassword = await bcrypt.hash(teacher.password, 10);
//     await Teacher.update(
//       { password: hashedPassword },
//       { where: { id: teacher.id } }
//     );
//   }
//   console.log("Teacher passwords updated successfully!");
// };

// // Call both functions
// const updatePasswords = async () => {
//   await updateStudentPasswords();
//   await updateTeacherPasswords();
//   console.log("All passwords updated successfully!");
// };

// // Execute the update
// updatePasswords().catch((err) => {
//   console.error("Error updating passwords:", err);
// });
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next(); // Continue to the next middleware
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};
// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user, role;

    // Check if the user is a student
    const student = await Student.findOne({ where: { email } });
    if (student) {
      const isPasswordValid = await bcrypt.compare(password, student.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid password." });
      }
      user = student;
      role = "student";
    } else {
      // Check if the user is a teacher
      const teacher = await Teacher.findOne({ where: { email } });
      if (teacher) {
        const isPasswordValid = await bcrypt.compare(
          password,
          teacher.password
        );
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid password." });
        }
        user = teacher;
        role = "teacher";
      } else {
        return res.status(404).json({ error: "User not found." });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: "2h" } // Token expiration
    );

    return res.json({
      message: "Login successful!",
      token,
      role,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "An error occurred during login." });
  }
});

app.get("/groups", authenticateToken, async (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const groups = await Group.findAll({
      where: { teacher_id: req.user.id },
      attributes: ["id", "nume_grupa"],
    });

    res.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

app.get("/exams", authenticateToken, async (req, res) => {
  const user = req.user;
  const now = new Date();

  try {
    if (user.role === "teacher") {
      // Update statusuri pentru examenele profesorului
      await Exam.update(
        { status: "ongoing" },
        {
          where: {
            teacher_id: user.id,
            start_date: { [Op.lte]: now },
            end_date: { [Op.gte]: now },
            status: { [Op.notIn]: ["ongoing", "invalid"] },
          },
        }
      );

      await Exam.update(
        { status: "closed" },
        {
          where: {
            teacher_id: user.id,
            end_date: { [Op.lt]: now },
            status: { [Op.notIn]: ["closed", "invalid"] },
          },
        }
      );

      await Exam.update(
        { status: "pending" },
        {
          where: {
            teacher_id: user.id,
            start_date: { [Op.gt]: now },
            status: { [Op.notIn]: ["pending", "invalid"] },
          },
        }
      );

      const exams = await Exam.findAll({
        where: { teacher_id: user.id },
        include: [
          { model: Group, attributes: ["nume_grupa"] },
          { model: Student, attributes: ["name"] },
        ],
        order: [["id", "ASC"]],
      });

      return res.json(exams);
    }

    if (user.role === "student") {
      // Update status doar pentru examenele proprii
      await Exam.update(
        { status: "ongoing" },
        {
          where: {
            student_id: user.id,
            start_date: { [Op.lte]: now },
            end_date: { [Op.gte]: now },
            status: { [Op.notIn]: ["ongoing", "invalid"] },
          },
        }
      );

      await Exam.update(
        { status: "closed" },
        {
          where: {
            student_id: user.id,
            end_date: { [Op.lt]: now },
            status: { [Op.notIn]: ["closed", "invalid"] },
          },
        }
      );

      await Exam.update(
        { status: "pending" },
        {
          where: {
            student_id: user.id,
            start_date: { [Op.gt]: now },
            status: { [Op.notIn]: ["pending", "invalid"] },
          },
        }
      );

      const exams = await Exam.findAll({
        where: { student_id: user.id },
        attributes: ["id", "title", "start_date", "end_date", "status"],
        order: [["start_date", "ASC"]],
      });

      return res.json(exams);
    }

    return res.status(403).json({ error: "Access denied" });
  } catch (err) {
    console.error("Error getting exams:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/exams/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const exam = await Exam.findByPk(id);

    if (!exam) return res.status(404).json({ error: "Exam not found." });

    const isTeacher =
      req.user.role === "teacher" && req.user.id === exam.teacher_id;
    const isStudent =
      req.user.role === "student" && req.user.id === exam.student_id;

    if (!isTeacher && !isStudent) {
      return res.status(403).json({ error: "Access denied." });
    }

    res.json(exam);
  } catch (err) {
    console.error("Error fetching exam:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.post("/exams", authenticateToken, async (req, res) => {
  const { title, requirement, start_date, end_date, group_id } = req.body;
  const teacherId = req.user.id;

  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    // 1. Găsește toți studenții din grupă, ordonați alfabetic
    const students = await Student.findAll({
      where: { group_id },
      order: [["name", "ASC"]],
    });

    if (!students || students.length === 0) {
      return res.status(404).json({ error: "No students in selected group." });
    }

    // 2. Caută toate examenele EXISTENTE ale grupei
    const existingExams = await Exam.findAll({
      where: {
        group_id,
        teacher_id: teacherId,
      },
    });

    // 3. Creează câte un examen nou pentru fiecare student
    const now = new Date();
    const status =
      now < new Date(start_date)
        ? "pending"
        : now >= new Date(start_date) && now <= new Date(end_date)
        ? "ongoing"
        : "closed";

    // 4. Determină frecvența de suprascriere
    const nrSubiecteExistente =
      existingExams.length > 0
        ? new Set(existingExams.map((e) => e.requirement)).size
        : 0;

    const frequency = nrSubiecteExistente + 1; // dacă 1 subiect → din 2 în 2

    const updatedExams = [];

    for (let i = 1; i <= students.length; i++) {
      const student = students[i - 1];

      if (i % frequency === 0) {
        // Caută dacă studentul are deja un examen
        const existingExam = existingExams.find(
          (e) => e.student_id === student.id
        );

        if (existingExam) {
          // Update existing
          await Exam.update(
            {
              requirement,
              title,
              start_date,
              end_date,
              status,
            },
            { where: { id: existingExam.id } }
          );
          updatedExams.push(existingExam.id);
        } else {
          // Create new
          const newExam = await Exam.create({
            student_id: student.id,
            teacher_id: teacherId,
            group_id,
            requirement,
            title,
            start_date,
            end_date,
            status,
          });
          updatedExams.push(newExam.id);
        }
      }
    }

    return res.status(200).json({
      message: `Exam distributed to ${updatedExams.length} students (1 per ${frequency}).`,
    });
  } catch (error) {
    console.error("Error distributing exam:", error);
    return res.status(500).json({ error: "Failed to distribute exam." });
  }
});

app.get("/exam-groups", authenticateToken, async (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const exams = await Exam.findAll({
      where: { teacher_id: req.user.id },
      attributes: [
        "requirement",
        [sequelize.fn("MIN", sequelize.col("start_date")), "start_date"],
        [sequelize.fn("MAX", sequelize.col("end_date")), "end_date"],
        "title",
      ],
      group: ["requirement", "title"],
      order: [["title", "ASC"]],
    });

    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching grouped exams" });
  }
});

app.put("/exams/by-requirement", authenticateToken, async (req, res) => {
  const { oldRequirement, newRequirement, title, start_date, end_date } =
    req.body;

  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    await Exam.update(
      {
        requirement: newRequirement,
        title,
        start_date,
        end_date,
        status: "closed",
      },
      {
        where: {
          teacher_id: req.user.id,
          requirement: oldRequirement,
        },
      }
    );

    res.json({ message: "All matching exams updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

app.put("/exams/:id/grade", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { grade } = req.body;

  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Access denied." });
  }

  if (!grade || isNaN(grade) || grade < 1 || grade > 10) {
    return res.status(400).json({ error: "Invalid grade. Must be 1 - 10." });
  }

  try {
    const exam = await Exam.findByPk(id);

    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    if (req.user.id !== exam.teacher_id) {
      return res
        .status(403)
        .json({ error: "You are not the owner of this exam." });
    }

    exam.grade = grade;
    await exam.save();

    res.json({ message: "Grade saved successfully", exam });
  } catch (err) {
    console.error("Error updating grade:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.put("/exams/:id/submit", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const exam = await Exam.findByPk(id);

    if (!exam) {
      return res.status(404).json({ error: "Exam not found." });
    }

    if (req.user.id !== exam.student_id) {
      return res
        .status(403)
        .json({ error: "This exam does not belong to you." });
    }

    if (exam.status !== "ongoing") {
      return res.status(400).json({ error: "Examenul nu mai este activ." });
    }

    exam.response = response;
    exam.status = "closed";
    await exam.save();

    res.json({ message: "Răspunsul a fost salvat cu succes!" });
  } catch (err) {
    console.error("Error submitting exam:", err);
    res.status(500).json({ error: "Server error." });
  }
});

app.put("/exams/:id/invalidate", authenticateToken, async (req, res) => {
  try {
    const exam = await Exam.findByPk(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    exam.status = "invalid";
    await exam.save();

    res.json({ message: "Exam marked as invalid." });
  } catch (error) {
    console.error("Error invalidating exam:", error);
    res.status(500).json({ error: "Failed to invalidate exam." });
  }
});
let gdbProcess = null;

app.post("/debug/start", authenticateToken, (req, res) => {
  const { code } = req.body;
  const fileName = `temp_${Date.now()}.cpp`;
  const filePath = path.join(__dirname, fileName);
  fs.writeFileSync(filePath, code);

  const execCommand = `g++ -g ${filePath} -o ${filePath}.out`;
  exec(execCommand, (error, stdout, stderr) => {
    if (error) return res.json({ error: stderr });

    gdbProcess = spawn("gdb", [`${filePath}.out`]);
    gdbProcess.stdout.setEncoding("utf8");

    gdbProcess.stdout.on("data", (data) => {
      console.log("GDB stdout:", data);
    });

    gdbProcess.stderr.on("data", (data) => {
      console.error("GDB stderr:", data);
    });

    res.json({ message: "GDB started", file: fileName });
  });
});

const cleanGdbOutput = (raw) =>
  raw
    .replace(/\(gdb\)\s*/g, "") // elimină prompturile (gdb)
    .replace(/\x1b\[[0-9;]*m/g, "") // elimină codurile ANSI de culoare
    .trim();

app.post("/debug/cmd", async (req, res) => {
  const { command } = req.body;

  if (!gdbProcess) {
    return res.status(400).json({ error: "Debugger not started" });
  }

  const sendCommand = (cmd) => {
    return new Promise((resolve) => {
      let buffer = "";

      const onData = (data) => {
        buffer += data;
        if (data.includes("(gdb)")) {
          gdbProcess.stdout.off("data", onData);
          resolve(cleanGdbOutput(buffer));
        }
      };

      gdbProcess.stdout.on("data", onData);
      gdbProcess.stdin.write(`${cmd}\n`);
    });
  };

  const mainOutput = await sendCommand(command);

  let varsOutput = "";
  if (["next", "step", "continue", "run"].some((c) => command.includes(c))) {
    const rawLocals = await sendCommand("info locals");

    const variables = rawLocals
      .split("\n")
      .filter((line) => line.includes(" = "))
      .map((line) => line.split(" = ")[0].trim());

    const detailed = [];

    for (const variable of variables) {
      const detail = await sendCommand(`print ${variable}`);
      detailed.push(`${variable} = ${detail}`);
    }

    varsOutput = detailed.join("\n");
  }

  res.json({
    output: mainOutput,
    variables: varsOutput,
  });
});

app.post("/compile", authenticateToken, async (req, res) => {
  const { code } = req.body;

  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Access denied." });
  }

  const fileName = `temp_${Date.now()}.cpp`;
  const filePath = path.join(__dirname, fileName);

  fs.writeFileSync(filePath, code);

  const execCommand = `g++ ${filePath} -o ${filePath}.out && ${filePath}.out`;

  exec(execCommand, (error, stdout, stderr) => {
    fs.unlinkSync(filePath); // cleanup .cpp
    if (fs.existsSync(`${filePath}.out`)) fs.unlinkSync(`${filePath}.out`); // cleanup binary

    if (error) {
      return res.json({ error: stderr || "Compilation error" });
    }

    res.json({ output: stdout });
  });
});
app.post("/debug/clear", authenticateToken, (req, res) => {
  const { file } = req.body;

  if (!file) return res.status(400).json({ error: "No file specified" });

  try {
    const base = path.join(__dirname, file);
    if (fs.existsSync(base)) fs.unlinkSync(base);
    if (fs.existsSync(`${base}.out`)) fs.unlinkSync(`${base}.out`);
    res.json({ message: "Files cleared" });
  } catch (err) {
    console.error("Error clearing debug files:", err);
    res.status(500).json({ error: "Failed to clear debug files" });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
