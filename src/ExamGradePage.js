import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ExamGradePage() {
  const { id } = useParams(); // exam ID from URL
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [grade, setGrade] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "teacher") {
      navigate("/");
      return;
    }

    fetch(`http://localhost:3001/exams/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setExam(data))
      .catch((err) => console.error("Error fetching exam:", err));
  }, [id, navigate]);

  const handleSaveGrade = async () => {
    const token = localStorage.getItem("token");

    if (!grade || isNaN(grade) || grade < 1 || grade > 10) {
      toast.error("Nota trebuie să fie între 1 și 10.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/exams/${id}/grade`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grade }),
      });

      if (res.ok) {
        navigate("/manage-exams", {
          state: {
            toastMessage: "Examen notat cu succes!",
            from: "gradeExam",
          },
        });
      } else {
        toast.error("Eroare la salvarea notei.");
      }
    } catch (err) {
      console.error("Eroare:", err);
      toast.error("A apărut o eroare.");
    }
  };

  if (!exam)
    return <p className="text-light text-center mt-5">Se încarcă...</p>;

  return (
    <div className="container mt-5">
      <h2 className="text-center text-light">Notează Examenul</h2>
      <div className="card p-4 mt-4">
        <h4>Student: {exam.Student?.name || "N/A"}</h4>
        <h5 className="mt-3">Titlu: {exam.title}</h5>
        <hr />
        <h6>Răspuns:</h6>
        <p className="border rounded p-3 bg-light">
          {exam.response || "Fără răspuns"}
        </p>

        <div className="form-group mt-4">
          <label>Notă (1 - 10)</label>
          <input
            type="number"
            step="0.01"
            min="1"
            max="10"
            className="form-control"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
        </div>

        <button onClick={handleSaveGrade} className="btn btn-success mt-3">
          Salvează nota
        </button>
      </div>
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}

export default ExamGradePage;
