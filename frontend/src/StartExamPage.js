import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BsPlayFill,
  BsBug,
  BsFlag,
  BsSkipForward,
  BsArrowRight,
  BsFastForward,
} from "react-icons/bs";

function StartExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [code, setCode] = useState(
    `#include<iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello world!";\n    return 0;\n}`
  );
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [examTerminated, setExamTerminated] = useState(false);
  const examSubmittedRef = useRef(false);
  const codeRef = useRef(code);
  const [debugOutput, setDebugOutput] = useState("");
  const [debugFile, setDebugFile] = useState("");
  const autoSubmitExam = useCallback(async () => {
    if (examSubmittedRef.current) return;

    examSubmittedRef.current = true; // ✅ Marchează examenul ca trimis
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:3001/exams/${id}/submit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response: codeRef.current }),
      });

      if (response.ok) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        navigate("/main", {
          state: {
            toastMessage: "Timpul a expirat! Răspunsul a fost trimis automat.",
            from: "expiredExam",
          },
        });
      } else {
        const data = await response.json();
        alert(data.error || "Eroare la trimiterea automată.");
      }
    } catch (err) {
      console.error("Eroare automată:", err);
      navigate("/main", {
        state: {
          toastMessage: "Eroare la trimiterea automată.",
          from: "errorSendingExam",
        },
      });
    }
  }, [id, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "student") {
      navigate("/");
      return;
    }
    const calculateRemainingTime = (endTime) => {
      const end = new Date(endTime);
      const interval = setInterval(() => {
        const now = new Date();
        const secondsLeft = Math.floor((end - now) / 1000);

        if (secondsLeft <= 0) {
          clearInterval(interval);
          setRemainingTime(0);
          autoSubmitExam();
        } else {
          setRemainingTime(secondsLeft);
        }
      }, 1000);
    };

    fetch(`http://localhost:3001/exams/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setExam(data);
        calculateRemainingTime(data.end_date);
      })
      .catch((err) => {
        console.error("Failed to load exam:", err);
        navigate("/main");
      });
  }, [id, navigate, autoSubmitExam]);

  // useEffect(() => {
  //   const addFullscreenListeners = () => {
  //     document.addEventListener("fullscreenchange", onFullscreenChange);
  //     document.addEventListener("webkitfullscreenchange", onFullscreenChange);
  //     document.addEventListener("mozfullscreenchange", onFullscreenChange);
  //     document.addEventListener("msfullscreenchange", onFullscreenChange);
  //   };

  //   const removeFullscreenListeners = () => {
  //     document.removeEventListener("fullscreenchange", onFullscreenChange);
  //     document.removeEventListener(
  //       "webkitfullscreenchange",
  //       onFullscreenChange
  //     );
  //     document.removeEventListener("mozfullscreenchange", onFullscreenChange);
  //     document.removeEventListener("msfullscreenchange", onFullscreenChange);
  //   };

  //   const onFullscreenChange = async () => {
  //     if (examTerminated) return;
  //     if (
  //       !document.fullscreenElement &&
  //       !document.webkitFullscreenElement &&
  //       !document.mozFullScreenElement &&
  //       !document.msFullscreenElement
  //     ) {
  //       if (examSubmittedRef.current) return;
  //       examSubmittedRef.current = true;
  //       const token = localStorage.getItem("token");

  //       await fetch(`http://localhost:3001/exams/${id}/invalidate`, {
  //         method: "PUT",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       })
  //         .then((res) => res.json())
  //         .then((data) => {
  //           console.log("Invalidate response:", data);
  //         })
  //         .catch((err) => console.error("Eroare la invalidate:", err))
  //         .finally(() => {
  //           navigate("/main", {
  //             state: {
  //               toastMessage:
  //                 "Ai ieșit din full screen. Examenul va fi anulat.",
  //               from: "invalidExam",
  //             },
  //           });
  //         });
  //     }
  //   };
  //   if (exam && exam.status === "ongoing") {
  //     //enterFullscreen();
  //     addFullscreenListeners();
  //   }

  //   return () => {
  //     removeFullscreenListeners();
  //   };
  // }, [exam, navigate, examTerminated, id]);

  // useEffect(() => {
  //   const handleCheatingAttempt = async () => {
  //     if (examTerminated) return;

  //     setExamTerminated(true);
  //     if (examSubmittedRef.current) return;
  //     examSubmittedRef.current = true;

  //     const token = localStorage.getItem("token");

  //     await fetch(`http://localhost:3001/exams/${id}/invalidate`, {
  //       method: "PUT",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     })
  //       .then((res) => res.json())
  //       .then((data) => {
  //         console.log("Invalidate response:", data);
  //       })
  //       .catch((err) => console.error("Eroare la invalidate:", err))
  //       .finally(() => {
  //         navigate("/main", {
  //           state: {
  //             toastMessage: "Ai părăsit fereastra! Examenul a fost anulat.",
  //             from: "invalidExam",
  //           },
  //         });
  //       });
  //   };

  //   const onBlur = () => {
  //     console.log("Blur detected");
  //     handleCheatingAttempt();
  //   };

  //   const onVisibilityChange = () => {
  //     if (document.hidden) {
  //       console.log("Visibility change detected");
  //       handleCheatingAttempt();
  //     }
  //   };

  //   window.addEventListener("blur", onBlur);
  //   document.addEventListener("visibilitychange", onVisibilityChange);

  //   return () => {
  //     window.removeEventListener("blur", onBlur);
  //     document.removeEventListener("visibilitychange", onVisibilityChange);
  //   };
  // }, [id, examTerminated, navigate]);
  const sendDebugCommand = async (cmd) => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3001/debug/cmd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ adaugă token-ul
      },
      body: JSON.stringify({ command: cmd }),
    });

    const data = await res.json();
    setDebugOutput((prev) => prev + "\n" + (data.output || data.error));
  };
  const startDebugSession = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3001/debug/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setDebugFile(data.file);
    setDebugOutput((prev) => prev + "\n" + (data.message || data.error));
  };
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!exam)
    return (
      <p className="text-center mt-5 text-light">Se încarcă examenul...</p>
    );

  return (
    <div className="container mt-5 mb-5">
      <div className="card p-4">
        <h2 className="text-center">Examen: {exam.title}</h2>
        <h4 className="text-center text-danger mt-2">
          Timp rămas: {formatTime(remainingTime)}
        </h4>

        <hr />

        <div className="mt-4">
          <h5>Cerință:</h5>
          <p className="bg-light border rounded p-3">{exam.requirement}</p>
        </div>

        <div className="form-group mt-4">
          <div className="btn-group mt-4 mb-3" role="group">
            <button
              className="btn btn-success"
              onClick={() => startDebugSession()}
            >
              <BsBug className="me-1" />
              Start Debug
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => sendDebugCommand(`break ${debugFile}:5`)}
            >
              <BsFlag className="me-1" />
              Set Breakpoint
            </button>

            <button
              className="btn btn-success"
              onClick={() => sendDebugCommand("run")}
            >
              <BsPlayFill className="me-1" />
              Run
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => sendDebugCommand("next")}
            >
              <BsSkipForward className="me-1" />
              Next
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => sendDebugCommand("step")}
            >
              <BsArrowRight className="me-1" />
              Step Into
            </button>

            <button
              className="btn btn-success"
              onClick={() => sendDebugCommand("continue")}
            >
              <BsFastForward className="me-1" />
              Continue
            </button>
          </div>
          <textarea
            rows="10"
            className="form-control font-monospace"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              codeRef.current = e.target.value; // 👈 Actualizăm referința
            }}
          ></textarea>
        </div>
        {debugOutput && (
          <div className="mt-3">
            <h5>Debug Output:</h5>
            <pre className="bg-dark text-light p-3 rounded">{debugOutput}</pre>
          </div>
        )}

        <button
          className="btn btn-primary mt-3"
          onClick={async () => {
            const token = localStorage.getItem("token");
            setLoading(true);

            const response = await fetch("http://localhost:3001/compile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ code }),
            });
            const data = await response.json();
            setOutput(data.output || data.error);
            setLoading(false);
          }}
        >
          Compilează
        </button>
        {loading && (
          <div className="text-center mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Se compilează...</span>
            </div>
            <p className="mt-2">Se compilează codul...</p>
          </div>
        )}
        {output && (
          <div className="mt-3">
            <h5>Rezultat:</h5>
            <pre className="bg-dark text-light p-3 rounded">{output}</pre>
          </div>
        )}
        <button
          className="btn btn-success mt-3"
          onClick={async () => {
            const token = localStorage.getItem("token");

            try {
              const response = await fetch(
                `http://localhost:3001/exams/${id}/submit`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ response: code }),
                }
              );

              if (response.ok) {
                setExamTerminated(true);
                examSubmittedRef.current = true;
                // 👉 Ieșim din fullscreen
                if (document.exitFullscreen) {
                  await document.exitFullscreen();
                }

                navigate("/main", {
                  state: {
                    toastMessage: "Examenul a fost trimis.",
                    from: "sentExam",
                  },
                });
              } else {
                const data = await response.json();
                alert(data.error || "Eroare la trimitere.");
              }
            } catch (err) {
              console.error("Eroare:", err);
              navigate("/main", {
                state: {
                  toastMessage: "Eroare la trimiterea examenului",
                  from: "errorSendingExam",
                },
              });
            }
          }}
        >
          Trimite Examen
        </button>
      </div>
    </div>
  );
}

export default StartExamPage;
