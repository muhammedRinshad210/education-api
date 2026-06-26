import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  FiBookOpen,
  FiEdit3,
  FiFolder,
  FiLayers,
  FiPlus,
  FiTrash2,
  FiUserCheck,
  FiUsers,
  FiVideo,
  FiClipboard,
  FiSettings,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/Badge";
import { DataTable } from "../components/DataTable";
import { SearchBar } from "../components/SearchBar";
import { Loader } from "../components/Loader";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormInput, FormSelect, FormTextarea } from "../components/FormFields";
import { EmptyState } from "../components/EmptyState";
import { Topbar } from "../components/Topbar";
import { Sidebar } from "../components/Sidebar";
import { formatCurrency, formatDateTime, clampText } from "../utils/format";
import { getErrorMessage, unwrapCollection } from "../services/http";
import {
  getAdminProfiles,
  getStudents,
  listAdminCourses,
  createAdminCourse,
  deleteAdminCourse,
} from "../services/adminService";
import {
  createCategory,
  deleteCategory,
  listCategories,
} from "../services/catalogService";
import {
  createInstructor,
  createAllocation,
  deleteInstructor,
  deleteAllocation,
  getActiveInstructorCourses,
  listAllocations,
  listInstructors,
} from "../services/instructorService";
import {
  createAssignment,
  createNote,
  createStudentAssignment,
  createVideo,
  deleteAssignment,
  deleteNote,
  deleteStudentAssignment,
  deleteVideo,
  listAssignments,
  listInstructorSubmissions,
  listNotes,
  listStudentAssignments,
  listStudentSubmissions,
  listVideos,
  submitStudentAssignment,
  getStudentCourseVideos,
} from "../services/contentService";
import { useCollection } from "../hooks/useCollection";

function useSearchPagination(items, search, page, pageSize = 6) {
  return useMemo(() => {
    const normalized = String(search || "").trim().toLowerCase();
    const filtered = normalized
      ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(normalized))
      : items;
    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);
    return { rows, total, totalPages, page: safePage };
  }, [items, page, pageSize, search]);
}

export function DashboardPage() {
  const { role, session, logout } = useAuth();

  return (
    <div className="grid gap-4">
      <div className="lg:hidden">
        <Sidebar session={session} role={role} onLogout={logout} />
      </div>
      <Topbar
        title="Dashboard"
        subtitle="Manage courses, users, learning content, and submissions."
        role={role}
        onRefresh={() => window.location.reload()}
      />

      {role === "admin" ? <AdminWorkspace /> : null}
      {role === "instructor" ? <InstructorWorkspace /> : null}
      {role === "student" ? <StudentWorkspace /> : null}
    </div>
  );
}

function AdminWorkspace() {
  const [state, setState] = useState({
    profiles: [],
    students: [],
    categories: [],
    courses: [],
    instructors: [],
    allocations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [profiles, students, categories, courses, instructors, allocations] = await Promise.all([
        getAdminProfiles(),
        getStudents(),
        listCategories(),
        listAdminCourses(),
        listInstructors(),
        listAllocations(),
      ]);

      setState({
        profiles: unwrapCollection(profiles),
        students: unwrapCollection(students),
        categories: unwrapCollection(categories),
        courses: unwrapCollection(courses),
        instructors: unwrapCollection(instructors),
        allocations: unwrapCollection(allocations),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Admin"
        title="Control center"
        description="Oversee categories, courses, instructors, allocations, and the current student base."
        actions={<button onClick={loadAll} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Sync data</button>}
      />
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? (
        <Loader label="Loading admin workspace" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Categories" value={state.categories.length} icon={<FiFolder />} />
            <StatCard label="Courses" value={state.courses.length} icon={<FiBookOpen />} />
            <StatCard label="Instructors" value={state.instructors.length} icon={<FiUserCheck />} />
            <StatCard label="Students" value={state.students.length} icon={<FiUsers />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <CategoryPanel items={state.categories} onChanged={loadAll} />
            <CoursePanel items={state.courses} categories={state.categories} onChanged={loadAll} />
            <InstructorPanel items={state.instructors} onChanged={loadAll} />
            <AllocationPanel items={state.allocations} courses={state.courses} instructors={state.instructors} onChanged={loadAll} />
          </div>

          <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Students</h2>
                <p className="text-sm text-slate-500">Recent enrollments and account metadata.</p>
              </div>
            </div>
            <SimpleSearchableTable
              items={state.students}
              columns={[
                { key: "username", header: "Username" },
                { key: "email", header: "Email" },
                { key: "phone", header: "Phone" },
                { key: "date_joined", header: "Joined", render: (row) => formatDateTime(row.date_joined) },
              ]}
              emptyTitle="No students yet"
              emptyDescription="Students will appear here after they register."
            />
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">Admin profile snapshot</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {state.profiles.slice(0, 3).map((profile) => (
                <article key={profile.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{profile.username}</p>
                  <p className="mt-1 text-xs text-slate-500">{profile.email || "No email"}</p>
                  <Badge tone="blue">{profile.role}</Badge>
                </article>
              ))}
              {!state.profiles.length ? (
                <EmptyState title="No admin profile data" description="The backend did not return any superuser records." />
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function CategoryPanel({ items, onChanged }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: "" } });
  const { rows, total, totalPages, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createCategory(values);
      toast.success("Category created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast.success("Category deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Categories</h2>
          <p className="text-sm text-slate-500">Create and organize course groups.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search categories..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "created_at", header: "Created", render: (row) => formatDateTime(row.created_at) },
          ]}
          rows={rows}
          loading={false}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create category" onClose={() => setOpen(false)} size="md">
        <form className="grid gap-4" onSubmit={submit}>
          <FormInput label="Category name" placeholder="Web Development" {...register("name", { required: "Category name is required" })} error={errors.name?.message} />
          <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            {isSubmitting ? "Saving..." : "Save category"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        description={`Delete ${deleteTarget?.name || "this category"}? Courses under it stay in the backend unless separately removed.`}
        destructive
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </section>
  );
}

function CoursePanel({ items, categories, onChanged }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { course_name: "", duration: "", fees: "", category: "" } });
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createAdminCourse({
        course_name: values.course_name,
        duration: values.duration,
        fees: Number(values.fees || 0),
        category: values.category || null,
      });
      toast.success("Course created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCourse(deleteTarget.id);
      toast.success("Course deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Courses</h2>
          <p className="text-sm text-slate-500">Manage course catalog records.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search courses..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "course_name", header: "Course" },
            { key: "duration", header: "Duration" },
            { key: "fees", header: "Fees", render: (row) => formatCurrency(row.fees) },
            { key: "category_details", header: "Category", render: (row) => row.category_details?.name || "Unassigned" },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create course" onClose={() => setOpen(false)} size="lg">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormInput label="Course name" placeholder="Frontend Mastery" {...register("course_name", { required: "Course name is required" })} error={errors.course_name?.message} />
          <FormInput label="Duration" placeholder="12 weeks" {...register("duration", { required: "Duration is required" })} error={errors.duration?.message} />
          <FormInput label="Fees" type="number" placeholder="25000" {...register("fees", { required: "Fees are required" })} error={errors.fees?.message} />
          <FormSelect label="Category" {...register("category")}>
            <option value="">Unassigned</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FormSelect>
          <div className="md:col-span-2">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {isSubmitting ? "Saving..." : "Save course"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete course"
        description={`Delete ${deleteTarget?.course_name || "this course"}?`}
        destructive
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </section>
  );
}

function InstructorPanel({ items, onChanged }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { name: "", email: "", phone: "" } });
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createInstructor(values);
      toast.success("Instructor created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInstructor(deleteTarget.id);
      toast.success("Instructor deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Instructors</h2>
          <p className="text-sm text-slate-500">Create and manage instructor profiles.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search instructors..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "active" ? "green" : "slate"}>{row.status || "pending"}</Badge> },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create instructor" onClose={() => setOpen(false)} size="md">
        <form className="grid gap-4" onSubmit={submit}>
          <FormInput label="Name" placeholder="Ayesha Khan" {...register("name", { required: "Name is required" })} error={errors.name?.message} />
          <FormInput label="Email" type="email" placeholder="name@example.com" {...register("email", { required: "Email is required" })} error={errors.email?.message} />
          <FormInput label="Phone" placeholder="Phone number" {...register("phone", { required: "Phone is required" })} error={errors.phone?.message} />
          <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            {isSubmitting ? "Saving..." : "Save instructor"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete instructor"
        description={`Delete ${deleteTarget?.name || "this instructor"}?`}
        destructive
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </section>
  );
}

function AllocationPanel({ items, courses, instructors, onChanged }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      instructor: "",
      course: "",
      allocation_status: "active",
      start_date: "",
      end_date: "",
    },
  });
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createAllocation({
        instructor: values.instructor,
        course: values.course,
        allocation_status: values.allocation_status,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
      });
      toast.success("Allocation created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAllocation(deleteTarget.id);
      toast.success("Allocation deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Allocations</h2>
          <p className="text-sm text-slate-500">Connect instructors to active courses.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search allocations..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            {
              key: "instructor_detail",
              header: "Instructor",
              render: (row) => row.instructor_detail?.name || row.instructor_detail?.instructor_id || row.instructor,
            },
            {
              key: "course_detail",
              header: "Course",
              render: (row) => row.course_detail?.course_name || row.course,
            },
            {
              key: "allocation_status",
              header: "Status",
              render: (row) => <Badge tone={row.allocation_status === "active" ? "green" : "slate"}>{row.allocation_status}</Badge>,
            },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create allocation" onClose={() => setOpen(false)} size="lg">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormSelect label="Instructor" {...register("instructor", { required: "Instructor is required" })} error={errors.instructor?.message}>
            <option value="">Select instructor</option>
            {instructors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </FormSelect>
          <FormSelect label="Course" {...register("course", { required: "Course is required" })} error={errors.course?.message}>
            <option value="">Select course</option>
            {courses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.course_name}
              </option>
            ))}
          </FormSelect>
          <FormSelect label="Status" {...register("allocation_status")}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </FormSelect>
          <FormInput label="Start date" type="date" {...register("start_date")} />
          <FormInput label="End date" type="date" {...register("end_date")} />
          <div className="md:col-span-2">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {isSubmitting ? "Saving..." : "Save allocation"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete allocation"
        description="Remove this course allocation?"
        destructive
        confirmLabel="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </section>
  );
}

function InstructorWorkspace() {
  const [state, setState] = useState({
    courses: [],
    assignments: [],
    notes: [],
    videos: [],
    submissions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [courses, assignments, notes, videos, submissions] = await Promise.all([
        getActiveInstructorCourses(),
        listAssignments(),
        listNotes(),
        listVideos(),
        listInstructorSubmissions(),
      ]);
      setState({
        courses: unwrapCollection(courses),
        assignments: unwrapCollection(assignments),
        notes: unwrapCollection(notes),
        videos: unwrapCollection(videos),
        submissions: unwrapCollection(submissions),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Instructor"
        title="Teaching workspace"
        description="Manage course content and monitor submitted work for active allocations."
        actions={<button onClick={loadAll} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Sync data</button>}
      />
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? (
        <Loader label="Loading instructor workspace" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Allocated courses" value={state.courses.length} icon={<FiBookOpen />} />
            <StatCard label="Assignments" value={state.assignments.length} icon={<FiClipboard />} />
            <StatCard label="Notes" value={state.notes.length} icon={<FiFolder />} />
            <StatCard label="Videos" value={state.videos.length} icon={<FiVideo />} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AssignmentPanel items={state.assignments} courses={state.courses} onChanged={loadAll} />
            <NotePanel items={state.notes} courses={state.courses} onChanged={loadAll} />
            <VideoPanel items={state.videos} courses={state.courses} onChanged={loadAll} />
            <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-950">Submitted assignments</h2>
              <div className="mt-4">
                <SimpleSearchableTable
                  items={state.submissions}
                  columns={[
                    { key: "id", header: "ID" },
                    { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "submitted" ? "green" : "slate"}>{row.status}</Badge> },
                    { key: "submitted_at", header: "Submitted", render: (row) => formatDateTime(row.submitted_at) },
                  ]}
                  emptyTitle="No submissions yet"
                  emptyDescription="Student submissions will show up here after they are sent."
                />
              </div>
            </section>
          </div>

          <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">My courses</h2>
            <div className="mt-4">
              <SimpleSearchableTable
                items={state.courses}
                columns={[
                  { key: "course_name", header: "Course" },
                  { key: "duration", header: "Duration" },
                  { key: "fees", header: "Fees", render: (row) => formatCurrency(row.fees) },
                ]}
                emptyTitle="No active courses"
                emptyDescription="Once the admin creates allocations, your active courses will appear here."
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function AssignmentPanel({ items, courses, onChanged }) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { course: "", name: "", description: "", due_date: "" } });
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createAssignment(values);
      toast.success("Assignment created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAssignment(deleteTarget.id);
      toast.success("Assignment deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Assignments</h2>
          <p className="text-sm text-slate-500">Create tasks for active courses.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search assignments..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "name", header: "Title" },
            { key: "course", header: "Course", render: (row) => row.course_details?.course_name || row.course },
            { key: "due_date", header: "Due", render: (row) => formatDateTime(row.due_date) },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create assignment" onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormSelect label="Course" {...register("course", { required: "Course is required" })} error={errors.course?.message}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.course_name}</option>
            ))}
          </FormSelect>
          <FormInput label="Title" placeholder="Assignment title" {...register("name", { required: "Title is required" })} error={errors.name?.message} />
          <FormTextarea label="Description" placeholder="Write instructions..." {...register("description")} />
          <FormInput label="Due date" type="date" {...register("due_date")} />
          <div className="md:col-span-2">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {isSubmitting ? "Saving..." : "Save assignment"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete assignment" description="Delete this assignment?" destructive confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}

function NotePanel({ items, courses, onChanged }) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { course: "", title: "", content: "" } });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createNote(values);
      toast.success("Note created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNote(deleteTarget.id);
      toast.success("Note deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Notes</h2>
          <p className="text-sm text-slate-500">Publish quick lecture notes and reminders.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search notes..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "title", header: "Title" },
            { key: "course", header: "Course", render: (row) => row.course_details?.course_name || row.course },
            { key: "content", header: "Content", render: (row) => clampText(row.content, 70) },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create note" onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormSelect label="Course" {...register("course", { required: "Course is required" })} error={errors.course?.message}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.course_name}</option>
            ))}
          </FormSelect>
          <FormInput label="Title" placeholder="Lecture note title" {...register("title", { required: "Title is required" })} error={errors.title?.message} />
          <FormTextarea className="md:col-span-2" label="Content" placeholder="Write the note..." {...register("content", { required: "Content is required" })} error={errors.content?.message} />
          <div className="md:col-span-2">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {isSubmitting ? "Saving..." : "Save note"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete note" description="Delete this note?" destructive confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}

function VideoPanel({ items, courses, onChanged }) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { course: "", title: "", description: "", video_url: "", order: 1 },
  });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createVideo({
        ...values,
        order: Number(values.order || 1),
      });
      toast.success("Video created");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVideo(deleteTarget.id);
      toast.success("Video deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Videos</h2>
          <p className="text-sm text-slate-500">Add course videos and sequencing.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search videos..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "title", header: "Title" },
            { key: "course", header: "Course", render: (row) => row.course_details?.course_name || row.course },
            { key: "order", header: "Order" },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create video" onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormSelect label="Course" {...register("course", { required: "Course is required" })} error={errors.course?.message}>
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.course_name}</option>
            ))}
          </FormSelect>
          <FormInput label="Title" placeholder="Video title" {...register("title", { required: "Title is required" })} error={errors.title?.message} />
          <FormInput label="Video URL" placeholder="https://..." {...register("video_url", { required: "Video URL is required" })} error={errors.video_url?.message} />
          <FormInput label="Order" type="number" {...register("order")} />
          <FormTextarea className="md:col-span-2" label="Description" placeholder="Optional description" {...register("description")} />
          <div className="md:col-span-2">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {isSubmitting ? "Saving..." : "Save video"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete video" description="Delete this video?" destructive confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}

function StudentWorkspace() {
  const [state, setState] = useState({
    submissions: [],
    studentAssignments: [],
    courseVideos: [],
  });
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videosLoading, setVideosLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [submissions, studentAssignments] = await Promise.all([
        listStudentSubmissions(),
        listStudentAssignments(),
      ]);
      setState((current) => ({
        ...current,
        submissions: unwrapCollection(submissions),
        studentAssignments: unwrapCollection(studentAssignments),
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const loadCourseVideos = async () => {
    if (!courseId) {
      toast.error("Enter a course ID first");
      return;
    }

    setVideosLoading(true);
    try {
      const response = await getStudentCourseVideos(courseId);
      setState((current) => ({
        ...current,
        courseVideos: unwrapCollection(response),
      }));
      toast.success("Videos loaded");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setVideosLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Student"
        title="Learning space"
        description="View course videos, track assignment submissions, and submit work."
        actions={<button onClick={loadAll} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Sync data</button>}
      />
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? (
        <Loader label="Loading student workspace" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Video records" value={state.courseVideos.length} icon={<FiVideo />} />
            <StatCard label="Submissions" value={state.submissions.length} icon={<FiClipboard />} />
            <StatCard label="Assignments" value={state.studentAssignments.length} icon={<FiLayers />} />
          </div>

          <section className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="grid gap-4">
              <h2 className="text-lg font-semibold text-slate-950">Course videos</h2>
              <FormInput label="Course ID" placeholder="Enter course ID" value={courseId} onChange={(event) => setCourseId(event.target.value)} />
              <button
                type="button"
                onClick={loadCourseVideos}
                disabled={videosLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
              >
                {videosLoading ? "Loading..." : "Load videos"}
              </button>
              <div className="grid gap-3">
                {state.courseVideos.length ? (
                  state.courseVideos.map((video) => (
                    <article key={video.id || video.title} className="rounded-2xl bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">{video.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{clampText(video.description, 70)}</p>
                      <a href={video.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-brand-700">
                        Open video
                      </a>
                    </article>
                  ))
                ) : (
                  <EmptyState title="No videos loaded" description="Enter a course ID to pull enrolled course videos." />
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <SubmitAssignmentPanel onChanged={loadAll} />
              <StudentAssignmentPanel items={state.studentAssignments} onChanged={loadAll} />
              <section className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-950">My submissions</h3>
                <div className="mt-4">
                  <SimpleSearchableTable
                    items={state.submissions}
                    columns={[
                      { key: "assignment_details", header: "Assignment", render: (row) => row.assignment_details?.title || row.assignment },
                      { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "submitted" ? "green" : "slate"}>{row.status}</Badge> },
                      { key: "submitted_at", header: "Submitted", render: (row) => formatDateTime(row.submitted_at) },
                    ]}
                    emptyTitle="No submissions yet"
                    emptyDescription="Your assignment submissions will appear here."
                  />
                </div>
              </section>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SubmitAssignmentPanel({ onChanged }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { assignment: "", submission_text: "" } });

  const submit = handleSubmit(async (values) => {
    try {
      await submitStudentAssignment(values);
      toast.success("Assignment submitted");
      reset();
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
      <h3 className="text-base font-semibold text-slate-950">Submit assignment</h3>
      <form className="mt-4 grid gap-4" onSubmit={submit}>
        <FormInput label="Assignment ID" placeholder="Assignment ID" {...register("assignment", { required: "Assignment ID is required" })} error={errors.assignment?.message} />
        <FormTextarea label="Submission text" placeholder="Write your submission..." {...register("submission_text", { required: "Submission text is required" })} error={errors.submission_text?.message} />
        <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </section>
  );
}

function StudentAssignmentPanel({ items, onChanged }) {
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { assignment_id: "", name: "", description: "" } });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query]);

  const submit = handleSubmit(async (values) => {
    try {
      await createStudentAssignment(values);
      toast.success("Student assignment saved");
      reset();
      setOpen(false);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudentAssignment(deleteTarget.id);
      toast.success("Student assignment deleted");
      setDeleteTarget(null);
      await onChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Student assignments</h3>
          <p className="text-sm text-slate-500">Create local submission records.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
          <FiPlus /> Add
        </button>
      </div>
      <div className="mt-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Search records..." />
      </div>
      <div className="mt-4">
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "assignment_details", header: "Assignment", render: (row) => row.assignment_details?.title || row.assignment },
            { key: "created_at", header: "Created", render: (row) => formatDateTime(row.created_at) },
          ]}
          rows={rows}
          total={total}
          page={safePage}
          pageSize={6}
          onPageChange={setPage}
          renderActions={(row) => (
            <button onClick={() => setDeleteTarget(row)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
              <FiTrash2 /> Delete
            </button>
          )}
        />
      </div>

      <Modal open={open} title="Create student assignment" onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <FormInput label="Assignment ID" placeholder="Assignment ID" {...register("assignment_id", { required: "Assignment ID is required" })} error={errors.assignment_id?.message} />
          <FormInput label="Name" placeholder="Record name" {...register("name", { required: "Name is required" })} error={errors.name?.message} />
          <FormTextarea className="md:col-span-2" label="Description" placeholder="Details..." {...register("description")} />
          <div className="md:col-span-2">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {isSubmitting ? "Saving..." : "Save record"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleteTarget)} title="Delete record" description="Delete this student assignment record?" destructive confirmLabel="Delete" onClose={() => setDeleteTarget(null)} onConfirm={remove} />
    </section>
  );
}

function SimpleSearchableTable({ items, columns, emptyTitle, emptyDescription }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { rows, total, page: safePage } = useSearchPagination(items, query, page, 6);

  useEffect(() => setPage(1), [query, items]);

  return (
    <div className="grid gap-4">
      <SearchBar value={query} onChange={setQuery} placeholder="Search..." />
      <DataTable
        columns={columns}
        rows={rows}
        total={total}
        page={safePage}
        pageSize={6}
        onPageChange={setPage}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </div>
  );
}
