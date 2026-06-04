import { useState } from "react";
import { motion } from "framer-motion";
import { uploadResume, matchResume } from "../api/api";
import MatchResults from "../components/MatchResults";

export default function Home() {
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("upload");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await uploadResume(file);
      setResumeId(res.data.id);
      setStep("match");
    } catch {
      setError("Failed to upload resume. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!resumeId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await matchResume(resumeId);
      setMatches(res.data.matches);
      setStep("results");
    } catch {
      setError("Failed to match resume.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Find Your Perfect Job</h1>
        <p className="text-gray-500">Upload your resume and let AI match you with the best jobs</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
      >
        {step === "upload" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Resume</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <p className="text-gray-500 text-sm">
                  {file ? file.name : "Click to upload PDF, DOCX, or TXT"}
                </p>
              </label>
            </div>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>
        )}

        {step === "match" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-green-600 font-medium mb-2">✅ Resume uploaded successfully!</p>
            <p className="text-gray-500 text-sm mb-6">Resume ID: {resumeId}</p>
            <button
              onClick={handleMatch}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? "Matching... this may take a moment" : "Match to Jobs"}
            </button>
          </motion.div>
        )}

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </motion.div>

      {step === "results" && <MatchResults matches={matches} />}
    </div>
  );
}
