import { http } from "./http";
import { endpoints } from "./endpoints";

export async function listCategories() {
  const response = await http.get(endpoints.catalog.categories);
  return response.data;
}

export async function createCategory(payload) {
  const response = await http.post(endpoints.catalog.categories, payload);
  return response.data;
}

export async function updateCategory(id, payload) {
  const response = await http.patch(endpoints.catalog.categoryDetail(id), payload);
  return response.data;
}

export async function deleteCategory(id) {
  const response = await http.delete(endpoints.catalog.categoryDetail(id));
  return response.data;
}

export async function getCategory(id) {
  const response = await http.get(endpoints.catalog.categoryDetail(id));
  return response.data;
}

export async function getCategoryCourses(id) {
  const response = await http.get(endpoints.catalog.categoryCourses(id));
  return response.data;
}

export async function listCourses() {
  const response = await http.get(endpoints.admin.courses);
  return response.data;
}

export async function getCourse(id) {
  const response = await http.get(endpoints.catalog.courseDetail(id));
  return response.data;
}
