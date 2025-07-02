import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BsPlayFill,
  BsBug,
  BsCaretRightSquareFill,
  BsSkipForward,
  BsFillTrashFill,
  BsArrowRight,
  BsFastForward,
} from "react-icons/bs";
import Editor from "@monaco-editor/react";
import "./DebuggerStyles.css";
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
  const debugFileRef = useRef("");
  const debugRef = useRef(null);
  const editorRef = useRef(null);
  const [breakpoints, setBreakpoints] = useState([]);
  const breakpointsRef = useRef([]);
  const [variables, setVariables] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitTimeoutId, setExitTimeoutId] = useState(null);
  const [exitCountdown, setExitCountdown] = useState(5);

  const autoSubmitExam = useCallback(async () => {
    if (examSubmittedRef.current) return;

    examSubmittedRef.current = true;
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

  useEffect(() => {
    const addFullscreenListeners = () => {
      document.addEventListener("fullscreenchange", onFullscreenChange);
      document.addEventListener("webkitfullscreenchange", onFullscreenChange);
      document.addEventListener("mozfullscreenchange", onFullscreenChange);
      document.addEventListener("msfullscreenchange", onFullscreenChange);
    };

    const removeFullscreenListeners = () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onFullscreenChange
      );
      document.removeEventListener("mozfullscreenchange", onFullscreenChange);
      document.removeEventListener("msfullscreenchange", onFullscreenChange);
    };

    const onFullscreenChange = () => {
      const isFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      if (!isFullscreen && !examSubmittedRef.current && !examTerminated) {
        setShowExitModal(true);
        setExitCountdown(5);

        const intervalId = setInterval(() => {
          setExitCountdown((prev) => {
            if (prev === 1) {
              clearInterval(intervalId);
              setExitTimeoutId(null);
              if (!examSubmittedRef.current) {
                examSubmittedRef.current = true;
                const token = localStorage.getItem("token");
                fetch(`http://localhost:3001/exams/${id}/invalidate`, {
                  method: "PUT",
                  headers: { Authorization: `Bearer ${token}` },
                }).finally(() => {
                  navigate("/main", {
                    state: {
                      toastMessage:
                        "Nu ai răspuns în timp. Examenul a fost anulat.",
                      from: "invalidExam",
                    },
                  });
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setExitTimeoutId(intervalId);
      }
    };
    if (exam && exam.status === "ongoing") {
      //enterFullscreen();
      addFullscreenListeners();
    }

    return () => {
      removeFullscreenListeners();
    };
  }, [exam, navigate, examTerminated, id]);

  useEffect(() => {
    const handleCheatingAttempt = async () => {
      if (examTerminated) return;

      setExamTerminated(true);
      if (examSubmittedRef.current) return;
      examSubmittedRef.current = true;

      const token = localStorage.getItem("token");

      await fetch(`http://localhost:3001/exams/${id}/invalidate`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Invalidate response:", data);
        })
        .catch((err) => console.error("Eroare la invalidate:", err))
        .finally(() => {
          navigate("/main", {
            state: {
              toastMessage: "Ai părăsit fereastra! Examenul a fost anulat.",
              from: "invalidExam",
            },
          });
        });
    };

    const onBlur = () => {
      console.log("Blur detected");
      handleCheatingAttempt();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        console.log("Visibility change detected");
        handleCheatingAttempt();
      }
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [id, examTerminated, navigate]);

  const sendDebugCommand = async (cmd) => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3001/debug/cmd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    debugFileRef.current = data.file;
    setDebugOutput((prev) => prev + "\n" + (data.message || data.error));
  };

  const fetchVariables = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:3001/debug/cmd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ command: "info locals" }),
    });

    const data = await res.json();
    return data.output || data.error;
  };

  const stepCommand = async (cmd) => {
    await sendDebugCommand(cmd);
    const vars = await fetchVariables();
    setVariables(vars);
  };

  useEffect(() => {
    if (debugRef.current) {
      debugRef.current.scrollTop = debugRef.current.scrollHeight;
    }
  }, [debugOutput]);

  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

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
        <h2 className="text-center">Exam: {exam.title}</h2>
        <h4 className="text-center text-danger mt-2">
          Remaining Time: {formatTime(remainingTime)}
        </h4>

        <hr />

        <div className="mt-4">
          <h5>Requirement:</h5>
          <p className="bg-light border rounded p-3">{exam.requirement}</p>
        </div>

        <div
          className="form-group mt-4 d-flex gap-3"
          style={{ flexWrap: "wrap" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div className="btn-group mt-4 mb-3" role="group">
              <button
                style={{ border: "3px solid green", color: "green" }}
                className="btn btn-white"
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  setLoading(true);

                  const response = await fetch(
                    "http://localhost:3001/compile",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ code }),
                    }
                  );
                  const data = await response.json();
                  setOutput(data.output || data.error);
                  setLoading(false);
                }}
              >
                <BsCaretRightSquareFill
                  className="me-1"
                  style={{ marginBottom: "3px" }}
                />
                Compile
              </button>
              <button
                className="btn btn-success"
                onClick={() => startDebugSession()}
              >
                <BsBug className="me-1" style={{ marginBottom: "3px" }} />
                Start Debug
              </button>

              <button
                className="btn btn-success"
                onClick={() => sendDebugCommand("run")}
              >
                <BsPlayFill className="me-1" style={{ marginBottom: "3px" }} />
                Run
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => stepCommand("next")}
              >
                <BsSkipForward
                  className="me-1"
                  style={{ marginBottom: "3px" }}
                />
                Next
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => stepCommand("step")}
              >
                <BsArrowRight
                  className="me-1"
                  style={{ marginBottom: "3px" }}
                />
                Step Into
              </button>

              <button
                className="btn btn-success"
                onClick={() => stepCommand("continue")}
              >
                <BsFastForward
                  className="me-1"
                  style={{ marginBottom: "3px" }}
                />
                Continue
              </button>
            </div>
            <div
              className="btn-group mt-4 mb-3"
              role="group"
              style={{ float: "right" }}
            >
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const token = localStorage.getItem("token");
                  const file = debugFileRef.current;

                  if (file) {
                    await fetch("http://localhost:3001/debug/clear", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ file }),
                    });
                  }

                  setDebugOutput("");
                  setVariables("");
                  setOutput("");
                  debugFileRef.current = "";
                }}
              >
                <BsFillTrashFill
                  className="me-1"
                  style={{ marginBottom: "3px" }}
                />
                Clear Output
              </button>
            </div>
          </div>
          <div style={{ flex: "1 1 60%", minWidth: "300px" }}>
            <Editor
              height="400px"
              defaultLanguage="cpp"
              value={code}
              onChange={(value) => {
                setCode(value);
                codeRef.current = value;
              }}
              onMount={(editor, monaco) => {
                editorRef.current = editor;

                editor.onMouseDown((e) => {
                  const debugFile = debugFileRef.current;
                  if (debugFile) {
                    if (
                      e.target.type ===
                      monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
                    ) {
                      const line = e.target.position.lineNumber;
                      const editorInstance = editorRef.current;
                      console.log(line);
                      const existing = breakpointsRef.current.find(
                        (bp) => bp.range.startLineNumber === line
                      );

                      if (existing) {
                        editorInstance.deltaDecorations([existing.id], []);
                        setBreakpoints((prev) =>
                          prev.filter((bp) => bp.line !== line)
                        );
                      } else {
                        const newDecoration = {
                          range: new monaco.Range(line, 1, line, 1),
                          options: {
                            isWholeLine: true,
                            className: "my-breakpoint-line",
                            glyphMarginClassName: "my-breakpoint-glyph",
                          },
                        };

                        const newId = editorInstance.deltaDecorations(
                          [],
                          [newDecoration]
                        )[0];

                        const newBreakpoint = {
                          id: newId,
                          line: line,
                          ...newDecoration,
                        };

                        setBreakpoints((prev) => {
                          const updated = [...prev, newBreakpoint];
                          breakpointsRef.current = updated;
                          return updated;
                        });

                        sendDebugCommand(`break ${debugFile}:${line}`);
                        setDebugOutput(
                          (prev) => prev + `\nBreakpoint set at line ${line}`
                        );
                      }
                    }
                  }
                });
              }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                glyphMargin: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          <div style={{ flex: "1 1 35%", minWidth: "280px" }}>
            <div className="mb-3">
              <h5>Debug Output:</h5>
              <pre
                ref={debugRef}
                className="bg-dark text-light p-3 rounded"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {debugOutput}
              </pre>
            </div>

            <div className="mb-3">
              <h5>Variables:</h5>
              <pre
                className="bg-dark text-warning p-3 rounded"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {variables}
              </pre>
            </div>

            <div className="mb-3">
              <h5>Output:</h5>
              <pre
                className="bg-dark text-light p-3 rounded"
                style={{ maxHeight: "150px", overflowY: "auto" }}
              >
                {output}
              </pre>
            </div>
            {loading && (
              <div className="text-center mt-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Se compilează...</span>
                </div>
                <p className="mt-2">Se compilează codul...</p>
              </div>
            )}
          </div>
        </div>
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
                // Ieșim din fullscreen
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
          Submit Exam
        </button>
      </div>
      {showExitModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmare ieșire fullscreen</h5>
                <p className="text-danger text-center fw-bold fs-5">
                  {exitCountdown} secunde rămase pentru confirmare
                </p>
              </div>
              <div className="modal-body">
                <p>
                  Dacă ieși din modul fullscreen, examenul va fi anulat. Ești
                  sigur că vrei să continui?
                </p>
              </div>
              <div
                className="modal-footer"
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <button
                  className="btn btn-danger"
                  style={{ float: "left" }}
                  onClick={async () => {
                    if (exitTimeoutId) {
                      clearInterval(exitTimeoutId);
                      setExitTimeoutId(null);
                      setExitCountdown(5);
                    }
                    setShowExitModal(false);
                    if (examSubmittedRef.current) return;
                    examSubmittedRef.current = true;
                    const token = localStorage.getItem("token");

                    await fetch(
                      `http://localhost:3001/exams/${id}/invalidate`,
                      {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    ).catch(console.error);

                    navigate("/main", {
                      state: {
                        toastMessage:
                          "Ai ieșit din fullscreen. Examenul a fost anulat.",
                        from: "invalidExam",
                      },
                    });
                  }}
                >
                  Confirmă ieșirea
                </button>
                <button
                  className="btn btn-success"
                  style={{ float: "right" }}
                  onClick={async () => {
                    if (exitTimeoutId) {
                      clearInterval(exitTimeoutId);
                      setExitTimeoutId(null);
                      setExitCountdown(5);
                    }
                    setShowExitModal(false);
                    const elem = document.documentElement;
                    if (elem.requestFullscreen) await elem.requestFullscreen();
                    else if (elem.webkitRequestFullscreen)
                      await elem.webkitRequestFullscreen();
                    else if (elem.mozRequestFullScreen)
                      await elem.mozRequestFullScreen();
                    else if (elem.msRequestFullscreen)
                      await elem.msRequestFullscreen();
                  }}
                >
                  Revin la examen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StartExamPage;
