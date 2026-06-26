export const endpoints = {
  auth: {
    adminLogin: "/login/",
    generalRegister: "/register/",
    studentRegister: "/student-register/",
    studentLogin: "/student-login/",
    instructorRegister: "/instructor-register/",
    instructorLogin: "/instructor-login/",
    home: "/home/",
  },
  admin: {
    profile: "/admin-profile/",
    students: "/admin/students/",
    courses: "/admin/course/",
  },
  catalog: {
    categories: "/category/",
    categoryDetail: (id) => `/category/${id}/`,
    categoryCourses: (id) => `/category/${id}/courses/`,
    courseDetail: (id) => `/course/${id}/`,
  },
  instructors: {
    base: "/instructor/",
    detail: (id) => `/instructor/${id}/`,
    coursesById: (id) => `/instructor/${id}/courses/`,
    activeCourses: "/instructor/courses/",
  },
  allocations: {
    base: "/instructor-course-allocation/",
    detail: (id) => `/instructor-course-allocation/${id}/`,
  },
  notes: {
    base: "/notes/",
    detail: (id) => `/notes/${id}/`,
  },
  videos: {
    base: "/videos/",
    detail: (id) => `/videos/${id}/`,
    studentList: (courseId) => `/student/courses/${courseId}/videos/`,
    studentDetail: (courseId, videoId) => `/student/courses/${courseId}/videos/${videoId}/`,
  },
  assignments: {
    base: "/instructor/assignments/",
    detail: (id) => `/instructor/assignments/${id}/`,
    instructorSubmissions: "/instructor/assignments/submissions/",
    studentSubmissions: "/student/assignments/submissions/",
  },
  studentAssignments: {
    base: "/student-assignments/",
    detail: (id) => `/student-assignments/${id}/`,
  },
};
