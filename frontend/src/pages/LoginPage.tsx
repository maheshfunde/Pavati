import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { login } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

const schema = z.object({
  username: z.string().min(2, "Username is required"),
  password: z.string().min(4, "Password is required")
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/app/dashboard";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" }
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token }) => {
      signIn(token);
      navigate(from, { replace: true });
    }
  });

  const apiError = (mutation.error as AxiosError<{ message?: string }> | null)?.response?.data?.message;

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage your billing operations.</p>

        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="grid two-gap">
          <label>
            Username
            <input {...form.register("username")} placeholder="owner_username" />
            <span className="field-error">{form.formState.errors.username?.message}</span>
          </label>

          <label>
            Password
            <input type="password" {...form.register("password")} placeholder="********" />
            <span className="field-error">{form.formState.errors.password?.message}</span>
          </label>

          <button className="button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </button>

          <p className="field-error">{apiError ?? ""}</p>
        </form>

        <p className="muted">
          New shop? <Link to="/register">Create owner account</Link>
        </p>
      </div>
    </div>
  );
}
