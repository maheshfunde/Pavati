import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { registerOwner } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";

const schema = z.object({
  shopName: z.string().min(2),
  ownerName: z.string().min(2),
  mobile: z.string().min(10),
  username: z.string().min(3),
  password: z.string().min(4)
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      shopName: "",
      ownerName: "",
      mobile: "",
      username: "",
      password: ""
    }
  });

  const mutation = useMutation({
    mutationFn: registerOwner,
    onSuccess: ({ token }) => {
      signIn(token);
      navigate("/app/dashboard", { replace: true });
    }
  });

  const apiError = (mutation.error as AxiosError<{ message?: string }> | null)?.response?.data?.message;

  return (
    <div className="auth-page">
      <div className="auth-panel wide">
        <h1>Create owner account</h1>
        <p className="muted">Start your billing workspace in one step.</p>

        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="grid two-column">
          <label>
            Shop Name
            <input {...form.register("shopName")} placeholder="My Store" />
            <span className="field-error">{form.formState.errors.shopName?.message}</span>
          </label>
          <label>
            Owner Name
            <input {...form.register("ownerName")} placeholder="Mahesh" />
            <span className="field-error">{form.formState.errors.ownerName?.message}</span>
          </label>
          <label>
            Mobile
            <input {...form.register("mobile")} placeholder="9876543210" />
            <span className="field-error">{form.formState.errors.mobile?.message}</span>
          </label>
          <label>
            Username
            <input {...form.register("username")} placeholder="mahesh_owner" />
            <span className="field-error">{form.formState.errors.username?.message}</span>
          </label>
          <label className="full">
            Password
            <input type="password" {...form.register("password")} placeholder="********" />
            <span className="field-error">{form.formState.errors.password?.message}</span>
          </label>

          <button className="button full" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Creating..." : "Create Account"}
          </button>

          <p className="field-error full">{apiError ?? ""}</p>
        </form>

        <p className="muted">
          Already registered? <Link to="/login">Go to login</Link>
        </p>
      </div>
    </div>
  );
}
