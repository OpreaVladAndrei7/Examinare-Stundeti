import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
function ManageExamsPage() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "teacher") {
      navigate("/"); // redirect if not teacher or not logged in
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

      // Clear the state after showing toast (optional but clean)
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="container mt-5">
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
          <p className="text-center text-muted">Niciun examen găsit.</p>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}

export default ManageExamsPage;
