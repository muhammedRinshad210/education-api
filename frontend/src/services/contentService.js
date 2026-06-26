import { http } from "./http";
import { buildQuery } from "./http";
import { endpoints } from "./endpoints";

export async function listNotes() {
  const response = await http.get(endpoints.notes.base);
  return response.data;
}

export async function createNote(payload) {
  const response = await http.post(endpoints.notes.base, payload);
  return response.data;
}

export async function updateNote(id, payload) {
  const response = await http.patch(endpoints.notes.detail(id), payload);
  return response.data;
}

export async function deleteNote(id) {
  const response = await http.delete(endpoints.notes.detail(id));
  return response.data;
}

export async function listVideos(query = {}) {
  const response = await http.get(`${endpoints.videos.base}${buildQuery(query)}`);
  return response.data;
}

export async function createVideo(payload) {
  const response = await http.post(endpoints.videos.base, payload);
  return response.data;
}

export async function updateVideo(id, payload) {
  const response = await http.patch(endpoints.videos.detail(id), payload);
  return response.data;
}

export async function deleteVideo(id) {
  const response = await http.delete(endpoints.videos.detail(id));
  return response.data;
}

export async function getStudentCourseVideos(courseId) {
  const response = await http.get(endpoints.videos.studentList(courseId));
  return response.data;
}

export async function getStudentCourseVideo(courseId, videoId) {
  const response = await http.get(endpoints.videos.studentDetail(courseId, videoId));
  return response.data;
}

export async function listAssignments(query = {}) {
  const response = await http.get(`${endpoints.assignments.base}${buildQuery(query)}`);
  return response.data;
}

export async function createAssignment(payload) {
  const response = await http.post(endpoints.assignments.base, payload);
  return response.data;
}

export async function updateAssignment(id, payload) {
  const response = await http.patch(endpoints.assignments.detail(id), payload);
  return response.data;
}

export async function deleteAssignment(id) {
  const response = await http.delete(endpoints.assignments.detail(id));
  return response.data;
}

export async function listInstructorSubmissions(query = {}) {
  const response = await http.get(`${endpoints.assignments.instructorSubmissions}${buildQuery(query)}`);
  return response.data;
}

export async function listStudentSubmissions() {
  const response = await http.get(endpoints.assignments.studentSubmissions);
  return response.data;
}

export async function submitStudentAssignment(payload) {
  const response = await http.post(endpoints.assignments.studentSubmissions, payload);
  return response.data;
}

export async function listStudentAssignments() {
  const response = await http.get(endpoints.studentAssignments.base);
  return response.data;
}

export async function createStudentAssignment(payload) {
  const response = await http.post(endpoints.studentAssignments.base, payload);
  return response.data;
}

export async function updateStudentAssignment(id, payload) {
  const response = await http.patch(endpoints.studentAssignments.detail(id), payload);
  return response.data;
}

export async function deleteStudentAssignment(id) {
  const response = await http.delete(endpoints.studentAssignments.detail(id));
  return response.data;
}
