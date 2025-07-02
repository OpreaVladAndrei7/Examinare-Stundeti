import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

function MainPage() {
  const [role, setRole] = useState(null);
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) {
      navigate("/"); // Redirect to login if not authenticated
    } else {
      setRole(userRole); // Set the role from localStorage

      if (userRole === "student") {
        fetch("http://localhost:3001/exams", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => setExams(data))
          .catch((err) => console.error("Failed to fetch exams:", err));
      }
      if (userRole === "teacher") {
        fetch("http://localhost:3001/exam-groups", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => setExams(data));
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (
      location.state?.from === "editRequirement" &&
      location.state.toastMessage
    ) {
      toast.success(location.state.toastMessage);
      navigate(location.pathname, { replace: true });
    } else if (
      location.state?.from === "addExam" &&
      location.state.toastMessage
    ) {
      toast.success(location.state.toastMessage);
      navigate(location.pathname, { replace: true });
    } else if (
      (location.state?.from === "invalidExam" ||
        location.state?.from === "errorSendingExam") &&
      location.state.toastMessage
    ) {
      toast.error(location.state.toastMessage);
      navigate(location.pathname, { replace: true });
    } else if (
      (location.state?.from === "expiredExam" ||
        location.state?.from === "sentExam") &&
      location.state.toastMessage
    ) {
      toast.success(location.state.toastMessage);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  return (
    <div className="container mt-5">
      <button
        style={{ float: "right" }}
        className="btn btn-danger mt-3"
        onClick={handleLogout}
      >
        Logout
      </button>
      <h1 className="text-center text-light">Welcome to the Exam Platform</h1>

      {role === "student" && (
        <div className="card p-4 mt-4">
          <h2>Student Dashboard</h2>
          <p>These are your assigned exams.</p>

          {exams.length > 0 ? (
            <table className="table table-bordered table-striped bg-white mt-3">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Action</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td>{exam.title}</td>
                    <td>{new Date(exam.start_date).toLocaleString()}</td>
                    <td>{new Date(exam.end_date).toLocaleString()}</td>
                    <td>{exam.status}</td>
                    <td>
                      {exam.status === "ongoing" ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText("");
                            } catch (err) {
                              console.warn("Clipboard write failed:", err);
                            }

                            enterFullscreen();
                            navigate(`/start-exam/${exam.id}`);
                          }}
                        >
                          Start Test
                        </button>
                      ) : (
                        <span className="text-muted">Unavailable</span>
                      )}
                    </td>
                    <td>{exam.grade !== null ? exam.grade : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted">No exams assigned yet.</p>
          )}
        </div>
      )}

      {role === "teacher" && (
        <div className="card p-4 mt-4">
          <h2>Teacher Dashboard</h2>
          <p>You can manage exams and evaluate student submissions.</p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-success flex-fill"
              onClick={() => navigate("/manage-exams")}
            >
              Manage Exams
            </button>
            <button
              className="btn btn-info flex-fill"
              onClick={() => navigate("/add-exam")}
            >
              Add Exams
            </button>
          </div>
          <h3> Programmed exams </h3>
          {exams.length > 0 ? (
            <table className="table table-bordered table-striped mt-3 bg-white">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Requirement</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, idx) => (
                  <tr key={idx}>
                    <td>{exam.title}</td>
                    <td>{exam.requirement}</td>
                    <td>{new Date(exam.start_date).toLocaleString()}</td>
                    <td>{new Date(exam.end_date).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-info"
                        onClick={() =>
                          navigate(
                            `/edit-requirement/${encodeURIComponent(
                              exam.requirement
                            )}`
                          )
                        }
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted mt-3">No exams created yet.</p>
          )}
        </div>
      )}
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}

export default MainPage;
