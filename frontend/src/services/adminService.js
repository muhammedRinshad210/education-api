import { http } from "./http";
import { endpoints } from "./endpoints";

export async function getAdminProfiles() {
  const response = await http.get(endpoints.admin.profile);
  return response.data;
}

export async function getStudents() {
  const response = await http.get(endpoints.admin.students);
  return response.data;
}

export async function listAdminCourses() {
  const response = await http.get(endpoints.admin.courses);
  return response.data;
}

export async function createAdminCourse(payload) {
  const response = await http.post(endpoints.admin.courses, payload);
  return response.data;
}

export async function updateAdminCourse(id, payload) {
  const response = await http.patch(endpoints.catalog.courseDetail(id), payload);
  return response.data;
}

export async function deleteAdminCourse(id) {
  const response = await http.delete(endpoints.catalog.courseDetail(id));
  return response.data;
}
