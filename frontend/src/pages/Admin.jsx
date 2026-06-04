import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadJob, listJobs, deleteJob, getJob } from "../api/api";

function JobCard({ job, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(null);
  const [loadingDesc, setLoadingDesc] = useState(false);

  const handleView = async () => {
    if (expanded) { setExpanded(false); return; }
    if (!description) {
      setLoadingDesc(true);
      try {
        const res = await getJob(job.id);
        setDescription(res.data.description);
      } finally {
        setLoadingDesc(false);
      }
    }
    setExpanded(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-3"
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
            💼
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{job.title}</p>
            <p className="text-xs text-gray-400 font-mono">{job.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleView}
            className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium transition-colors"
          >
            {loadingDesc ? "..." : expanded ? "Hide" : "View"}
          </button>
          <button
            onClick={() => onDelete(job.id)}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Job Description</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                {description}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Admin() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchJobs = async () => {
    const res = await listJobs();
    setJobs(res.data);
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleUpload = async () => {
    if (!title || !file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await uploadJob(title, file);
      setSuccess("Job uploaded successfully!");
      setTitle("");
      setFile(null);
      fetchJobs();
    } catch {
      setError("Failed to upload job.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch {
      setError("Failed to delete job.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage job listings</p>
      </motion.div>

      {/* Upload Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
      >
        <h2 className="text-base font-semibold text-gray-700 mb-4">Upload New Job</h2>
        <div className="flex gap-3 mb-3">
          <input
            type="text"
            placeholder="Job Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <label
          htmlFor="job-upload"
          className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-purple-400 transition-colors mb-4"
        >
          <span className="text-lg">📎</span>
          <span className="text-sm text-gray-500 flex-1">
            {file ? file.name : "Click to upload PDF, DOCX, or TXT"}
          </span>
          {file && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
              {(file.size / 1024).toFixed(1)} KB
            </span>
          )}
        </label>
        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => setFile(e.target.files[0])}
          className="hidden"
          id="job-upload"
        />
        <button
          onClick={handleUpload}
          disabled={!title || !file || loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? "Uploading..." : "Upload Job"}
        </button>
        {success && <p className="text-green-600 text-sm mt-3">✅ {success}</p>}
        {error && <p className="text-red-500 text-sm mt-3">❌ {error}</p>}
      </motion.div>

      {/* Jobs List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Job Listings</h2>
          <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-3 py-1 rounded-full">
            {jobs.length} jobs
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm">No jobs uploaded yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
