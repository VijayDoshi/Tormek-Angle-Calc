import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type MachineSettings, 
  type InsertMachineSettings, 
  type Wheel, 
  type InsertWheel, 
  type CalculatorState, 
  type UpdateStateRequest 
} from "@shared/schema";

// ============================================
// MACHINE SETTINGS
// ============================================
export function useSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<InsertMachineSettings>) => {
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
    },
  });
}

// ============================================
// WHEELS
// ============================================
export function useWheels() {
  return useQuery({
    queryKey: [api.wheels.list.path],
    queryFn: async () => {
      const res = await fetch(api.wheels.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch wheels");
      return api.wheels.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWheel) => {
      const res = await fetch(api.wheels.create.path, {
        method: api.wheels.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create wheel");
      return api.wheels.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.wheels.list.path] });
    },
  });
}

export function useUpdateWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertWheel>) => {
      const url = buildUrl(api.wheels.update.path, { id });
      const res = await fetch(url, {
        method: api.wheels.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update wheel");
      return api.wheels.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.wheels.list.path] });
    },
  });
}

export function useDeleteWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.wheels.delete.path, { id });
      const res = await fetch(url, {
        method: api.wheels.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete wheel");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.wheels.list.path] });
    },
  });
}

// ============================================
// CALCULATOR STATE (SESSION)
// ============================================
export function useCalculatorState() {
  return useQuery({
    queryKey: [api.state.get.path],
    queryFn: async () => {
      const res = await fetch(api.state.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch state");
      return api.state.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: UpdateStateRequest) => {
      const res = await fetch(api.state.update.path, {
        method: api.state.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save state");
      return api.state.update.responses[200].parse(await res.json());
    },
    onSuccess: (newData) => {
      queryClient.setQueryData([api.state.get.path], newData);
    },
  });
}
