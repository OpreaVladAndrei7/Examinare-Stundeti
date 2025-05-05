import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import MainPage from "./MainPage";
import AddExamPage from "./AddExamPage";
import ManageExamsPage from "./ManageExamsPage";
import ExamGradePage from "./ExamGradePage";
import StartExamPage from "./StartExamPage";
import EditRequirementPage from "./EditRequirementPage";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/add-exam" element={<AddExamPage />} />
          <Route path="/manage-exams" element={<ManageExamsPage />} />
          <Route path="/grade-exam/:id" element={<ExamGradePage />} />
          <Route path="/start-exam/:id" element={<StartExamPage />} />
          <Route
            path="/edit-requirement/:requirement"
            element={<EditRequirementPage />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
