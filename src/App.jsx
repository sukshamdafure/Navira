import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL || "";
function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [studyText, setStudyText] = useState("");
  const [selectedTask, setSelectedTask] = useState("summarize");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  // Authentication states
  const [token, setToken] = useState(
    () => localStorage.getItem("naviraToken") || "",
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("naviraUser")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setAuthMessage("");

    try {
      const endpoint = authMode === "register" ? "register" : "login";

      const body =
        authMode === "register"
          ? { name: authName, email: authEmail, password: authPassword }
          : { email: authEmail, password: authPassword };

      const response = await fetch(`${API_URL}/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthMessage("Registration successful! Please log in.");
        setAuthMode("login");
        setAuthPassword("");
      } else {
        localStorage.setItem("naviraToken", data.token);
        localStorage.setItem("naviraUser", JSON.stringify(data.user));

        setToken(data.token);
        setCurrentUser(data.user);
        setAuthMessage("");
        setAuthPassword("");
      }
    } catch (error) {
      setError(error.message || "Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("naviraToken");
    localStorage.removeItem("naviraUser");

    setToken("");
    setCurrentUser(null);
    setHistory([]);
    setResult("");
    setStudyText("");
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch history");
      }
      console.log("Fetched History:", data.history);
      setHistory(data.history);
    } catch (error) {
      console.error("History Error:", error);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/history/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete history");
      }

      await fetchHistory();
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const handleGetStarted = (task) => {
    setSelectedTask(task);
    setActiveNav(task);

    document.getElementById("study-workspace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleStartLearning = async () => {
    if (!studyText.trim()) {
      setError("Please enter your study material first!");
      return;
    }

    setAiLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch(`${API_URL}/api/study`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studyText: studyText,
          task: selectedTask,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setResult(data.result);
      await fetchHistory();
    } catch (error) {
      console.error(error);
      setError(error.message || "Unable to connect to the server!");
    } finally {
      setAiLoading(false);
    }
  };

  if (!token || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F7FF] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center text-[#9B8AFB]">
            Navira.
          </h1>

          <p className="text-center text-[#89869B] mt-2">
            Learn beyond limits.
          </p>

          <h2 className="text-xl font-semibold mt-8 text-[#27243A]">
            {authMode === "login" ? "Welcome Back!" : "Create Your Account"}
          </h2>

          <p className="text-sm text-[#89869B] mt-1 mb-6">
            {authMode === "login"
              ? "Log in to continue learning."
              : "Register to start your learning journey."}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "register" && (
              <input
                type="text"
                placeholder="Full Name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
                className="w-full p-3 border border-[#E9E3FF] rounded-lg outline-none focus:border-[#9B8AFB]"
              />
            )}

            <input
              type="email"
              placeholder="Email Address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              className="w-full p-3 border border-[#E9E3FF] rounded-lg outline-none focus:border-[#9B8AFB]"
            />

            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              minLength={8}
              className="w-full p-3 border border-[#E9E3FF] rounded-lg outline-none focus:border-[#9B8AFB]"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            {authMessage && (
              <p className="text-sm text-green-600">{authMessage}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9B8AFB] hover:bg-[#8875F0] text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
            >
              {loading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login"
                  : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#89869B] mt-6">
            {authMode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setError("");
                setAuthMessage("");
              }}
              className="ml-2 text-[#8875F0] font-semibold"
            >
              {authMode === "login" ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F7FF] text-[#27243A]">
      {" "}
      {/* Sidebar */}
      <aside className="w-full lg:w-64 lg:min-h-screen bg-white border-b lg:border-b-0 lg:border-r border-[#EEEAFB] p-4 lg:p-6">
        {" "}
        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#9B8AFB]">Navira.</h1>

          <p className="text-xs text-gray-400 mt-1">Learn beyond limits.</p>
        </div>
        {/* Navigation */}
        <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2 lg:gap-3">
          {" "}
          <button
            onClick={() => setActiveNav("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-xl ${
              activeNav === "dashboard"
                ? "bg-[#F0ECFF] text-[#8B78EF] font-semibold"
                : "text-gray-500 hover:bg-[#F8F7FF]"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleGetStarted("summarize")}
            className={`w-full text-left px-4 py-3 rounded-xl ${
              activeNav === "summarize"
                ? "bg-[#F0ECFF] text-[#8B78EF] font-semibold"
                : "text-gray-500 hover:bg-[#F8F7FF]"
            }`}
          >
            Notes Summarizer
          </button>
          <button
            onClick={() => handleGetStarted("explain")}
            className={`w-full text-left px-4 py-3 rounded-xl ${
              activeNav === "explain"
                ? "bg-[#F0ECFF] text-[#8B78EF] font-semibold"
                : "text-gray-500 hover:bg-[#F8F7FF]"
            }`}
          >
            Concept Explainer
          </button>
          <button
            onClick={() => handleGetStarted("quiz")}
            className={`w-full text-left px-4 py-3 rounded-xl ${
              activeNav === "quiz"
                ? "bg-[#F0ECFF] text-[#8B78EF] font-semibold"
                : "text-gray-500 hover:bg-[#F8F7FF]"
            }`}
          >
            Quiz Generator
          </button>
        </nav>
        <button
          onClick={handleLogout}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-100 bg-red-50/60 text-red-500 font-medium hover:bg-red-100 hover:border-red-200 transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
        {" "}
        {/* Welcome Section */}
        <div className="mb-10">
          <p className="text-sm font-medium text-[#9B8AFB] mb-2">
            YOUR PERSONAL AI STUDY SPACE
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {currentUser?.name || "Learner"}! 👋
          </h2>

          <p className="text-gray-500 mt-3">
            Turn your study material into knowledge. What would you like to
            learn today?
          </p>
        </div>
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {/* Summarizer Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EEEAFB]">
            <h3 className="text-lg font-bold">Notes Summarizer</h3>

            <p className="text-sm text-gray-500 mt-3">
              Turn your lengthy study notes into short and clear summaries.
            </p>

            <button
              onClick={() => handleGetStarted("summarize")}
              className="mt-6 bg-[#9B8AFB] hover:bg-[#8875ED] active:scale-95 text-white px-5 py-2 rounded-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>

          {/* Concept Explainer Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EEEAFB]">
            <h3 className="text-lg font-bold">Concept Explainer</h3>

            <p className="text-sm text-gray-500 mt-3">
              Understand difficult concepts with simple AI-powered explanations.
            </p>
            <button
              onClick={() => handleGetStarted("explain")}
              className="mt-6 bg-[#9B8AFB] hover:bg-[#8875ED] active:scale-95 text-white px-5 py-2 rounded-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>

          {/* Quiz Generator Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#EEEAFB]">
            <h3 className="text-lg font-bold">Quiz Generator</h3>

            <p className="text-sm text-gray-500 mt-3">
              Test your knowledge with quizzes generated from your study
              material.
            </p>

            <button
              onClick={() => handleGetStarted("quiz")}
              className="mt-6 bg-[#9B8AFB] hover:bg-[#8875ED] active:scale-95 text-white px-5 py-2 rounded-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
        {/* Study Workspace */}
        <div
          id="study-workspace"
          className="mt-12 bg-white rounded-2xl border border-[#EEEAFB] p-4 sm:p-6 lg:p-8 shadow-sm"
        >
          {" "}
          <h3 className="text-xl font-bold">Start Learning</h3>
          <p className="text-sm text-gray-500 mb-4">
            Enter your study material and let Navira help you understand it.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
            <button
              onClick={() => setSelectedTask("summarize")}
              className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5B8FF] ${
                selectedTask === "summarize"
                  ? "bg-[#9B8AFB] text-white shadow-sm"
                  : "bg-white text-[#27243A] border border-[#E9E3FF] hover:bg-[#F8F7FF] hover:border-[#C5B8FF]"
              }`}
            >
              Summarize
            </button>

            <button
              onClick={() => setSelectedTask("explain")}
              className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5B8FF] ${
                selectedTask === "explain"
                  ? "bg-[#9B8AFB] text-white shadow-sm"
                  : "bg-white text-[#27243A] border border-[#E9E3FF] hover:bg-[#F8F7FF] hover:border-[#C5B8FF]"
              }`}
            >
              Explain
            </button>

            <button
              onClick={() => setSelectedTask("quiz")}
              className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5B8FF] ${
                selectedTask === "quiz"
                  ? "bg-[#9B8AFB] text-white shadow-sm"
                  : "bg-white text-[#27243A] border border-[#E9E3FF] hover:bg-[#F8F7FF] hover:border-[#C5B8FF]"
              }`}
            >
              Generate Quiz
            </button>
          </div>
          <textarea
            value={studyText}
            onChange={(e) => setStudyText(e.target.value)}
            placeholder="Paste your notes or enter a topic you want to learn..."
            className="w-full h-40 mt-6 p-3 sm:p-4 border border-[#EEEAFB] rounded-xl outline-none focus:ring-2 focus:ring-[#C5B8FF] resize-none"
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleStartLearning}
              disabled={aiLoading}
              className="bg-[#9B8AFB] hover:bg-[#8875ED] text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? "Generating..." : "Start Learning"}
            </button>
          </div>
        </div>
        {aiLoading && (
          <div className="flex items-center gap-3 mt-5 text-[#9B8AFB]">
            <div className="w-5 h-5 border-2 border-[#E9E3FF] border-t-[#9B8AFB] rounded-full animate-spin"></div>

            <p className="font-medium">
              Navira is preparing your learning experience...
            </p>
          </div>
        )}
        {result && (
          <div className="bg-white rounded-2xl p-5 sm:p-7 mt-6 shadow-sm border border-[#E9E3FF] transition-all duration-200">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[#27243A]">
                  Your Result
                </h2>
                <p className="text-sm text-[#89869B] mt-1">
                  Generated by Navira AI
                </p>
              </div>

              <span className="text-xs font-medium bg-[#F0ECFF] text-[#8B78EF] px-3 py-1.5 rounded-full">
                {selectedTask === "summarize"
                  ? "Summary"
                  : selectedTask === "explain"
                    ? "Explanation"
                    : "Quiz"}
              </span>
            </div>

            <div className="border-t border-[#EEEAFB] pt-5">
              <p className="text-sm sm:text-base leading-7 text-[#5F5B70] whitespace-pre-wrap break-words">
                {result}
              </p>
            </div>
          </div>
        )}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold text-[#27243A]">
                Study History
              </h2>
              <p className="text-sm text-[#89869B] mt-1">
                Revisit your previous learning sessions.
              </p>
            </div>

            <span className="bg-[#F0ECFF] text-[#8B78EF] text-sm font-semibold px-3 py-1.5 rounded-full">
              {history.length} Sessions
            </span>
          </div>

          {history.length === 0 ? (
            <div className="bg-white border border-dashed border-[#DCD4FA] rounded-2xl p-8 text-center">
              <p className="text-[#89869B]">No study history available yet.</p>
              <p className="text-sm text-[#B0AABD] mt-1">
                Your completed learning sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E3FF] hover:shadow-md hover:border-[#D5CBFF] transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-[#27243A]">
                      {item.task === "summarize"
                        ? "Notes Summary"
                        : item.task === "explain"
                          ? "Concept Explanation"
                          : "Quiz"}
                    </h3>

                    <span className="text-xs font-medium bg-[#F0ECFF] text-[#8B78EF] px-2.5 py-1 rounded-full shrink-0">
                      {item.task === "summarize"
                        ? "Summary"
                        : item.task === "explain"
                          ? "Explain"
                          : "Quiz"}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-[#89869B] mb-4 break-words">
                    {item.studyText.length > 100
                      ? `${item.studyText.slice(0, 100)}...`
                      : item.studyText}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#EEEAFB]">
                    <p className="text-xs text-[#89869B]">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>

                    <button
                      onClick={() => handleDeleteHistory(item._id)}
                      className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
