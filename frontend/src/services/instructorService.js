import { http } from "./http";
import { buildQuery } from "./http";
import { endpoints } from "./endpoints";

export async function listInstructors() {
  const response = await http.get(endpoints.instructors.base);
  return response.data;
}

export async function getInstructor(id) {
  const response = await http.get(endpoints.instructors.detail(id));
  return response.data;
}

export async function createInstructor(payload) {
  const response = await http.post(endpoints.instructors.base, payload);
  return response.data;
}

export async function updateInstructor(id, payload) {
  const response = await http.patch(endpoints.instructors.detail(id), payload);
  return response.data;
}

export async function deleteInstructor(id) {
  const response = await http.delete(endpoints.instructors.detail(id));
  return response.data;
}

export async function getInstructorCoursesById(id) {
  const response = await http.get(endpoints.instructors.coursesById(id));
  return response.data;
}

export async function getActiveInstructorCourses() {
  const response = await http.get(endpoints.instructors.activeCourses);
  return response.data;
}

export async function listAllocations(query = {}) {
  const response = await http.get(`${endpoints.allocations.base}${buildQuery(query)}`);
  return response.data;
}

export async function createAllocation(payload) {
  const response = await http.post(endpoints.allocations.base, payload);
  return response.data;
}

export async function updateAllocation(id, payload) {
  const response = await http.patch(endpoints.allocations.detail(id), payload);
  return response.data;
}

export async function deleteAllocation(id) {
  const response = await http.delete(endpoints.allocations.detail(id));
  return response.data;
}
