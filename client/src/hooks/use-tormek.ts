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
// ============================================

export interface Machine {
  id: number;
  name: string;
  usbHorizontalDistance: number;
  wheelCenterToHousingTop: number;
  usbDiameter: number;
  jigDiameter: number;
  createdAt: string;
}

const KEYS = {
  legacySettings: "pe.settings.v1",
  machines: "pe.machines.v1",
  activeMachine: "pe.activeMachine.v1",
  wheels: "pe.wheels.v1",
  state: "pe.state.v1",
} as const;

const QK = {
  settings: ["local", "settings"] as const,
  machines: ["local", "machines"] as const,
  wheels: ["local", "wheels"] as const,
  state: ["local", "state"] as const,
};

const DEFAULT_MACHINES: Machine[] = [
  {
    id: 1,
    name: "Tormek T8",
    usbHorizontalDistance: 50.0,
    wheelCenterToHousingTop: 29.0,
    usbDiameter: 12.0,
    jigDiameter: 12.0,
    createdAt: new Date().toISOString(),
  },
];

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

// Loads machines, migrating legacy pe.settings.v1 entry if needed
function loadMachines(): Machine[] {
  const existing = localStorage.getItem(KEYS.machines);
  if (existing) {
    try {
      return JSON.parse(existing) as Machine[];
    } catch {
      return DEFAULT_MACHINES;
    }
  }
  // Migrate from legacy single-settings key
  const legacy = localStorage.getItem(KEYS.legacySettings);
  if (legacy) {
    try {
      const s = JSON.parse(legacy) as MachineSettings;
      const migrated: Machine[] = [
        {
          id: 1,
          name: s.name || "Tormek T8",
          usbHorizontalDistance: s.usbHorizontalDistance ?? 50,
          wheelCenterToHousingTop:
            s.wheelCenterToHousingTop === 32 ? 29 : (s.wheelCenterToHousingTop ?? 29),
          usbDiameter: s.usbDiameter ?? 12,
          jigDiameter: s.jigDiameter ?? 12,
          createdAt: new Date().toISOString(),
        },
      ];
      write(KEYS.machines, migrated);
      return migrated;
    } catch {
      // fall through
    }
  }
  return DEFAULT_MACHINES;
}

function getActiveMachineId(): number {
  return read<number>(KEYS.activeMachine, 1);
}

function getActiveMachine(machines: Machine[]): Machine {
  const id = getActiveMachineId();
  return machines.find((m) => m.id === id) ?? machines[0] ?? DEFAULT_MACHINES[0];
}

// ============================================
// MACHINES
// ============================================
export function useMachines() {
  return useQuery<Machine[]>({
    queryKey: QK.machines,
    queryFn: async () => loadMachines(),
  });
}

export function useCreateMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Machine, "id" | "createdAt">) => {
      const list = loadMachines();
      const machine: Machine = {
        ...data,
        id: nextId(list),
        createdAt: new Date().toISOString(),
      };
      write(KEYS.machines, [...list, machine]);
      return machine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.machines });
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Machine>) => {
      const list = loadMachines();
      const next = list.map((m) => (m.id === id ? { ...m, ...updates } : m));
      write(KEYS.machines, next);
      return next.find((m) => m.id === id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.machines });
      queryClient.invalidateQueries({ queryKey: QK.settings });
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const list = loadMachines();
      if (list.length <= 1) throw new Error("Cannot delete the only machine");
      const next = list.filter((m) => m.id !== id);
      write(KEYS.machines, next);
      const activeId = getActiveMachineId();
      if (activeId === id) {
        write(KEYS.activeMachine, next[0].id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.machines });
      queryClient.invalidateQueries({ queryKey: QK.settings });
    },
  });
}

export function useActiveMachineId() {
  return useQuery<number>({
    queryKey: ["local", "activeMachine"],
    queryFn: async () => getActiveMachineId(),
  });
}

export function useSetActiveMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      write(KEYS.activeMachine, id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local", "activeMachine"] });
      queryClient.invalidateQueries({ queryKey: QK.settings });
      queryClient.invalidateQueries({ queryKey: QK.machines });
    },
  });
}

// ============================================
// MACHINE SETTINGS (active machine — used by calculator)
// ============================================
export function useSettings() {
  return useQuery<MachineSettings>({
    queryKey: QK.settings,
    queryFn: async () => {
      const machines = loadMachines();
      const m = getActiveMachine(machines);
      return {
        id: m.id,
        name: m.name,
        usbHorizontalDistance: m.usbHorizontalDistance,
        wheelCenterToHousingTop: m.wheelCenterToHousingTop,
        usbDiameter: m.usbDiameter,
        jigDiameter: m.jigDiameter ?? 12,
        unit: "mm",
        createdAt: new Date(m.createdAt),
      };
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<InsertMachineSettings>) => {
      const activeId = getActiveMachineId();
      const list = loadMachines();
      const next = list.map((m) => (m.id === activeId ? { ...m, ...updates } : m));
      write(KEYS.machines, next);
      const updated = next.find((m) => m.id === activeId) ?? next[0];
      return {
        ...updated,
        unit: "mm",
        createdAt: new Date(updated.createdAt),
      } as MachineSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QK.settings, data);
      queryClient.invalidateQueries({ queryKey: QK.machines });
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
