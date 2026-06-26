import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiMail, FiPhone, FiUser, FiLock, FiHash } from "react-icons/fi";
import toast from "react-hot-toast";
import { FormInput, FormSelect } from "../components/FormFields";
import { registerStudent, registerInstructor } from "../services/authService";
import { getErrorMessage } from "../services/http";

const roles = [
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
];

export function RegisterPage() {
  const [role, setRole] = useState("student");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      first_name: "",
      last_name: "",
      instructor_id: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (role === "student") {
        await registerStudent(values);
        toast.success("Student account created");
      } else {
        await registerInstructor(values);
        toast.success("Instructor account activated");
      }
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur md:p-8">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-700">Create account</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Set up access</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Students self-register. Instructors activate an existing staff record using the instructor ID, email, and phone number.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <FormSelect label="Account type" value={role} onChange={(event) => setRole(event.target.value)}>
          {roles.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </FormSelect>

        {role === "student" ? (
          <>
            <FormInput
              label="Username"
              placeholder="Choose a username"
              leftIcon={<FiUser />}
              {...register("username", { required: "Username is required" })}
              error={errors.username?.message}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="First name"
                placeholder="First name"
                {...register("first_name")}
                error={errors.first_name?.message}
              />
              <FormInput
                label="Last name"
                placeholder="Last name"
                {...register("last_name")}
                error={errors.last_name?.message}
              />
            </div>
            <FormInput
              label="Email"
              type="email"
              placeholder="name@example.com"
              leftIcon={<FiMail />}
              {...register("email", {
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Enter a valid email address",
                },
              })}
              error={errors.email?.message}
            />
            <FormInput
              label="Phone"
              placeholder="Phone number"
              leftIcon={<FiPhone />}
              {...register("phone")}
              error={errors.phone?.message}
            />
          </>
        ) : (
          <>
            <FormInput
              label="Instructor ID"
              placeholder="Instructor ID"
              leftIcon={<FiHash />}
              {...register("instructor_id", { required: "Instructor ID is required" })}
              error={errors.instructor_id?.message}
            />
            <FormInput
              label="Email"
              type="email"
              placeholder="name@example.com"
              leftIcon={<FiMail />}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Enter a valid email address",
                },
              })}
              error={errors.email?.message}
            />
            <FormInput
              label="Phone"
              placeholder="Phone number"
              leftIcon={<FiPhone />}
              {...register("phone", { required: "Phone is required" })}
              error={errors.phone?.message}
            />
          </>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Password"
            type="password"
            placeholder="Create a password"
            leftIcon={<FiLock />}
            {...register("password", { required: "Password is required" })}
            error={errors.password?.message}
          />
          <FormInput
            label="Confirm password"
            type="password"
            placeholder="Repeat the password"
            leftIcon={<FiLock />}
            {...register("confirm_password", {
              required: "Please confirm your password",
              validate: (value) => value === watch("password") || "Passwords do not match",
            })}
            error={errors.confirm_password?.message}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Processing..." : "Create account"}
          <FiArrowRight />
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </section>
  );
}
