import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { BsFillTrashFill, BsFiletypeXlsx } from "react-icons/bs";
import * as XLSX from "xlsx";

function ManageExamsPage() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "teacher") {
      navigate("/");
    } else {
      fetch("http://localhost:3001/exams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setExams(data))
        .catch((err) => console.error("Failed to fetch exams:", err));
    }
  }, [navigate]);
  useEffect(() => {
    if (location.state?.from === "gradeExam" && location.state.toastMessage) {
      toast.success(location.state.toastMessage);

      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleExportToExcel = () => {
    const data = exams.map((exam) => ({
      Student: exam.Student?.name || "N/A",
      Nota: exam.grade !== null ? exam.grade : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Note Studenți");

    XLSX.writeFile(workbook, "rezultate_examene.xlsx");
  };

  const handleDeleteAllExams = async () => {
    const confirmDelete = window.confirm(
      "Ești sigur că vrei să ștergi toate examenele?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3001/exams", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      toast.success(data.message || "Examenele au fost șterse.");
      setExams([]);
    } catch (err) {
      console.error("Eroare la ștergere:", err);
      toast.error("Eroare la ștergerea examenelor.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-end gap-2 mb-3">
        <button className="btn btn-success" onClick={handleExportToExcel}>
          <BsFiletypeXlsx className="me-1" style={{ marginBottom: "3px" }} />
          Exportă XLS
        </button>
        <button className="btn btn-danger" onClick={handleDeleteAllExams}>
          <BsFillTrashFill className="me-1" style={{ marginBottom: "3px" }} />
          Șterge toate examenele
        </button>
      </div>

      <h2 className="text-light text-center">Exams Management</h2>
      <div className="table-responsive mt-4">
        <table className="table table-bordered table-striped bg-white">
          <thead>
            <tr>
              <th>Student</th>
              <th>Title</th>
              <th>Response</th>
              <th>Status</th>
              <th>Grade</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.Student?.name || "N/A"}</td>
                <td>{exam.title}</td>
                <td>{exam.response || <em>Fără răspuns</em>}</td>
                <td>{exam.status}</td>
                <td>{exam.grade !== null ? exam.grade : "-"}</td>
                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => navigate(`/grade-exam/${exam.id}`)}
                  >
                    Notează
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {exams.length === 0 && (
          <div style={{ background: "white" }}>
            <p
              className="text-center text-muted"
              style={{ padding: "20px 10px" }}
            >
              Niciun examen găsit.
            </p>
          </div>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}

export default ManageExamsPage;
