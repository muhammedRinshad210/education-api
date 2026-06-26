import { http } from "./http";
import { endpoints } from "./endpoints";

export async function loginAs(role, payload) {
  const url =
    role === "student"
      ? endpoints.auth.studentLogin
      : role === "instructor"
        ? endpoints.auth.instructorLogin
        : endpoints.auth.adminLogin;

  const response = await http.post(url, payload, { skipAuth: true });
  return response.data;
}

export async function registerStudent(payload) {
  const response = await http.post(endpoints.auth.studentRegister, payload, {
    skipAuth: true,
  });
  return response.data;
}

export async function registerInstructor(payload) {
  const response = await http.post(endpoints.auth.instructorRegister, payload, {
    skipAuth: true,
  });
  return response.data;
}

export async function getHome() {
  const response = await http.get(endpoints.auth.home);
  return response.data;
}
