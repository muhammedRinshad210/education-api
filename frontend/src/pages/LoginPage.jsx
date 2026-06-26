import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FiArrowRight, FiLock, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormInput, FormSelect } from "../components/FormFields";
import { loginAs } from "../services/authService";
import { getErrorMessage } from "../services/http";
import { useAuth } from "../context/AuthContext";

const roles = [
  { value: "admin", label: "Admin" },
  { value: "instructor", label: "Instructor" },
  { value: "student", label: "Student" },
];

export function LoginPage() {
  const [role, setRole] = useState("admin");
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const data = await loginAs(role, values);
      const nextSession = {
        access: data.access,
        refresh: data.refresh,
        role,
        user:
          data.student ||
          data.instructor ||
          {
            username: values.username,
            name: values.username,
            email: "",
          },
      };

      login(nextSession);
      toast.success("Signed in successfully");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur md:p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-700">Secure access</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Sign in to the appropriate workspace. JWT tokens are stored locally and attached automatically to protected requests.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <FormSelect
          label="Workspace"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {roles.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </FormSelect>

        <FormInput
          label={role === "instructor" ? "Instructor ID / Email / Phone" : "Username"}
          placeholder="Enter your username"
          leftIcon={<FiUser />}
          {...register("username", { required: "Username is required" })}
          error={errors.username?.message}
        />

        <FormInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          leftIcon={<FiLock />}
          {...register("password", { required: "Password is required" })}
          error={errors.password?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
          <FiArrowRight />
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Need an account?{" "}
        <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Register here
        </Link>
      </p>
    </section>
  );
}
