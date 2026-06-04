import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getJob } from "../api/api";

const scoreColor = (score) => {
  if (score >= 0.8) return "bg-green-100 text-green-700";
  if (score >= 0.5) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-600";
};

export default function MatchResults({ matches }) {
  if (!matches || matches.length === 0)
    return <p className="text-gray-500 mt-4 text-sm">No matches found.</p>;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Matched Jobs</h3>
      {matches.map((match, idx) => (
        <MatchCard key={match.job_id} match={match} idx={idx} />
      ))}
    </div>
  );
}

function MatchCard({ match, idx }) {
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (expanded) { setExpanded(false); return; }
    if (!description) {
      setLoading(true);
      try {
        const res = await getJob(match.job_id);
        setDescription(res.data.description);
      } catch {
        setDescription("Could not load job description.");
      } finally {
        setLoading(false);
      }
    }
    setExpanded(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-4"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
              #{idx + 1}
            </span>
            <h4 className="text-base font-semibold text-gray-800">{match.title}</h4>
          </div>
          {match.score != null && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${scoreColor(match.score)}`}>
              {Math.round(match.score * 100)}% match
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{match.reason}</p>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400 font-mono">{match.job_id.slice(0, 12)}...</p>
          <button
            onClick={handleToggle}
            className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 font-medium transition-colors"
          >
            {loading ? "Loading..." : expanded ? "Hide Details" : "View Job Details"}
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Job Description</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">
                {description}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
