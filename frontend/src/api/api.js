import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const uploadJob = (title, file) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  return axios.post(`${BASE_URL}/jobs`, formData);
};

export const listJobs = () => axios.get(`${BASE_URL}/jobs`);

export const getJob = (jobId) => axios.get(`${BASE_URL}/jobs/${jobId}`);

export const deleteJob = (jobId) => axios.delete(`${BASE_URL}/jobs/${jobId}`);

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${BASE_URL}/resumes`, formData);
};

export const matchResume = (resumeId) =>
  axios.post(`${BASE_URL}/resumes/${resumeId}/match`);

export const adminLogin = (username, password) =>
  axios.post(`${BASE_URL}/admin/login`, { username, password });
