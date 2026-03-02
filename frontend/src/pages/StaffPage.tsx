import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createStaff, deleteStaff, fetchCurrentUser, fetchStaff, updateStaff } from "../api/endpoints";
import type { StaffResponse } from "../api/types";

const schema = z.object({
  username: z.string().min(3),
  password: z.string().min(4)
});

type FormValues = z.infer<typeof schema>;

export function StaffPage() {
  const queryClient = useQueryClient();
  const [editingStaff, setEditingStaff] = useState<StaffResponse | null>(null);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser
  });

  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
    enabled: currentUser?.role === "OWNER"
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" }
  });

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: FormValues }) => updateStaff(id, payload),
    onSuccess: () => {
      form.reset();
      setEditingStaff(null);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    }
  });

  const apiErrorSource = createMutation.error ?? updateMutation.error ?? deleteMutation.error;
  const apiError =
    apiErrorSource instanceof AxiosError
      ? typeof apiErrorSource.response?.data === "string"
        ? apiErrorSource.response.data
        : (apiErrorSource.response?.data as { message?: string } | undefined)?.message
      : undefined;

  if (userLoading) {
    return <p className="muted">Loading user...</p>;
  }

  if (currentUser?.role !== "OWNER") {
    return (
      <section className="stack">
        <header>
          <h1>Staff Management</h1>
        </header>
        <div className="card">
          <p className="field-error">Only owner can access staff management.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      <header>
        <h1>Staff Management</h1>
        <p className="muted">Owner-only access. Add, update, and delete staff users for your shop.</p>
      </header>

      <div className="card">
        <h2>{editingStaff ? "Update Staff" : "Add Staff"}</h2>
        <form
          className="grid form-row"
          onSubmit={form.handleSubmit((values) => {
            if (editingStaff) {
              updateMutation.mutate({ id: editingStaff.id, payload: values });
              return;
            }
            createMutation.mutate(values);
          })}
        >
          <input placeholder="Username" {...form.register("username")} />
          <input placeholder="Password" type="password" {...form.register("password")} />
          <button className="button" type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : editingStaff
                ? "Update Staff"
                : "Create Staff"}
          </button>
          {editingStaff && (
            <button
              className="button button-ghost"
              type="button"
              onClick={() => {
                setEditingStaff(null);
                form.reset();
              }}
            >
              Cancel
            </button>
          )}
        </form>

        {(createMutation.isSuccess || updateMutation.isSuccess) && (
          <p className="success-text">Staff details saved successfully.</p>
        )}
        {apiError && <p className="field-error">{apiError}</p>}
      </div>

      <div className="card">
        <h2>Staff List</h2>
        {staffLoading ? (
          <p className="muted">Loading staff list...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td>{staff.id}</td>
                  <td>{staff.username}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={() => {
                          setEditingStaff(staff);
                          form.reset({ username: staff.username, password: "" });
                        }}
                      >
                        Update
                      </button>
                      <button
                        className="button button-danger"
                        type="button"
                        onClick={() => deleteMutation.mutate(staff.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
