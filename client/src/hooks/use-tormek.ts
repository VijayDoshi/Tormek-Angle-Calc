import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type MachineSettings,
  type InsertMachineSettings,
  type Wheel,
  type InsertWheel,
  type CalculatorState,
  type UpdateStateRequest,
} from "@shared/schema";

// ============================================
// Local-storage backed data layer (offline-first, no server required).
// Hook signatures intentionally match the previous network versions so
// pages don't have to change.
// ============================================

const KEYS = {
  settings: "pe.settings.v1",
  wheels: "pe.wheels.v1",
  state: "pe.state.v1",
} as const;

const QK = {
  settings: ["local", "settings"] as const,
  wheels: ["local", "wheels"] as const,
  state: ["local", "state"] as const,
};

const DEFAULT_SETTINGS: MachineSettings = {
  id: 1,
  name: "My Tormek T8",
  usbHorizontalDistance: 50.0,
  wheelCenterToHousingTop: 29.0,
  usbDiameter: 12.0,
  unit: "mm",
  createdAt: new Date(),
};

const DEFAULT_WHEELS: Wheel[] = [
  { id: 1, name: "SG-250 (New)", diameter: 250.0, isActive: true, createdAt: new Date() },
  { id: 2, name: "SG-250 (Worn)", diameter: 220.0, isActive: true, createdAt: new Date() },
  { id: 3, name: "SB-250 (Blackstone)", diameter: 250.0, isActive: true, createdAt: new Date() },
];

const DEFAULT_STATE: CalculatorState = {
  id: 1,
  selectedWheelId: 1,
  targetAngle: 18.0,
  bladeProjection: 140.0,
  lastResult: null,
  updatedAt: new Date(),
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function nextId(items: { id: number }[]): number {
  return items.reduce((max, w) => (w.id > max ? w.id : max), 0) + 1;
}

// ============================================
// MACHINE SETTINGS
// ============================================
export function useSettings() {
  return useQuery<MachineSettings>({
    queryKey: QK.settings,
    queryFn: async () => read(KEYS.settings, DEFAULT_SETTINGS),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<InsertMachineSettings>) => {
      const current = read(KEYS.settings, DEFAULT_SETTINGS);
      const merged: MachineSettings = { ...current, ...updates };
      return write(KEYS.settings, merged);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QK.settings, data);
    },
  });
}

// ============================================
// WHEELS
// ============================================
export function useWheels() {
  return useQuery<Wheel[]>({
    queryKey: QK.wheels,
    queryFn: async () => read(KEYS.wheels, DEFAULT_WHEELS),
  });
}

export function useCreateWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWheel) => {
      const list = read(KEYS.wheels, DEFAULT_WHEELS);
      const wheel: Wheel = {
        id: nextId(list),
        name: data.name ?? "New Wheel",
        diameter: data.diameter ?? 250.0,
        isActive: data.isActive ?? true,
        createdAt: new Date(),
      };
      write(KEYS.wheels, [...list, wheel]);
      return wheel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.wheels });
    },
  });
}

export function useUpdateWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertWheel>) => {
      const list = read(KEYS.wheels, DEFAULT_WHEELS);
      const next = list.map((w) => (w.id === id ? { ...w, ...updates } : w));
      write(KEYS.wheels, next);
      return next.find((w) => w.id === id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.wheels });
    },
  });
}

export function useDeleteWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const list = read(KEYS.wheels, DEFAULT_WHEELS);
      write(KEYS.wheels, list.filter((w) => w.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.wheels });
    },
  });
}

// ============================================
// CALCULATOR STATE (SESSION)
// ============================================
export function useCalculatorState() {
  return useQuery<CalculatorState>({
    queryKey: QK.state,
    queryFn: async () => read(KEYS.state, DEFAULT_STATE),
  });
}

export function useUpdateState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: UpdateStateRequest) => {
      const current = read(KEYS.state, DEFAULT_STATE);
      const merged: CalculatorState = { ...current, ...updates, updatedAt: new Date() };
      return write(KEYS.state, merged);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QK.state, data);
    },
  });
}
