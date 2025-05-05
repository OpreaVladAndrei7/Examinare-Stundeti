import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AddExamPage() {
  const [requirement, setRequirement] = useState("");
  //const [status, setStatus] = useState("pending");
  //const [message, setMessage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "teacher") {
      navigate("/"); // redirect if not logged in or not a teacher
    } else {
      // Fetch groups for the logged-in teacher
      fetch("http://localhost:3001/groups", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setGroups(data))
        .catch((err) => console.error("Error fetching groups:", err));
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error("Start date must be before end date.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          requirement,
          start_date: startDate,
          end_date: endDate,
          group_id: selectedGroupId,
        }),
      });

      if (response.ok) {
        navigate("/main", {
          state: {
            toastMessage: "Examen adaugat cu succes!",
            from: "addExam",
          },
        });
        setRequirement("");
        setStartDate("");
        setEndDate("");
      } else {
        const err = await response.json();
        toast.error("Failed to add exam. " + (err.error || "Unknown error."));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center text-light">Add New Exam</h2>
      <form onSubmit={handleSubmit} className="card p-4 mt-4">
        <div className="form-group mb-3">
          <label htmlFor="title">Exam Title</label>
          <input
            id="title"
            type="text"
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="group">Select Group</label>
          <select
            id="group"
            className="form-select"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            required
          >
            <option value="">Select group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nume_grupa}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group mb-3">
          <label htmlFor="requirement">Exam Requirement</label>
          <textarea
            id="requirement"
            className="form-control"
            rows="5"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            required
          />
        </div>
        <div className="form-group mb-3">
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            type="datetime-local"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            type="datetime-local"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100">
          Add Exam
        </button>
        {/* 
        {message && (
          <p
            className={`mt-3 text-center ${
              message.includes("success") ? "text-success" : "text-danger"
            }`}
          >
            {message}
          </p>
        )} */}
      </form>
      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

export default AddExamPage;
