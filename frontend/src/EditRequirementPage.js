import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function EditRequirementPage() {
  const { requirement } = useParams();
  const navigate = useNavigate();
  //const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    requirement: decodeURIComponent(requirement),
    title: "",
    start_date: "",
    end_date: "",
  });

  // const handleSuccess = () => {
  //   toast.success("Exam saved successfully!");

  //   setTimeout(() => {
  //     navigate("/main");
  //   }, 2000);
  // };

  const toDatetimeLocal = (dateStr) => {
    const date = new Date(dateStr);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    // Optionally: Fetch one exam with this requirement to prefill title/start/end
    const token = localStorage.getItem("token");
    fetch(`http://localhost:3001/exams/one-by-requirement/${requirement}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setFormData((prev) => ({
            ...prev,
            title: data.title,
            start_date: toDatetimeLocal(data.start_date),
            end_date: toDatetimeLocal(data.end_date),
          }));
        }
      });
  }, [requirement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const payload = {
      oldRequirement: decodeURIComponent(requirement),
      newRequirement: formData.requirement,
      title: formData.title,
      start_date: formData.start_date,
      end_date: formData.end_date,
    };

    const response = await fetch("http://localhost:3001/exams/by-requirement", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      //setMessage("Examenul a fost actualizat cu succes.");
      navigate("/main", {
        state: {
          toastMessage: "Examen salvat cu succes!",
          from: "editRequirement",
        },
      });
      //navigate("/main");
    } else {
      toast.error("Eroare la actualizare.");
      //setMessage("Eroare la actualizare.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="card p-4">
        <h2 className="mb-3">Edit exam: {decodeURIComponent(requirement)}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Requirement</label>
            <textarea
              className="form-control"
              rows="3"
              name="requirement"
              value={formData.requirement}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <input
              type="datetime-local"
              className="form-control"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">End Date</label>
            <input
              type="datetime-local"
              className="form-control"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          {/* {message && (
            <p
              className={`mt-3 text-center ${
                message.includes("succes") ? "text-success" : "text-danger"
              }`}
            >
              {message}
            </p>
          )} */}
        </form>
      </div>
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
}

export default EditRequirementPage;
