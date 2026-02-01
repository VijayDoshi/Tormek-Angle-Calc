
import { db } from "./db";
import {
  machineSettings,
  wheels,
  calculatorState,
  type MachineSettings,
  type InsertMachineSettings,
  type Wheel,
  type InsertWheel,
  type CalculatorState,
  type InsertCalculatorState,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Machine Settings
  getMachineSettings(): Promise<MachineSettings | undefined>;
  updateMachineSettings(settings: Partial<InsertMachineSettings>): Promise<MachineSettings>;

  // Wheels
  getWheels(): Promise<Wheel[]>;
  getWheel(id: number): Promise<Wheel | undefined>;
  createWheel(wheel: InsertWheel): Promise<Wheel>;
  updateWheel(id: number, wheel: Partial<InsertWheel>): Promise<Wheel>;
  deleteWheel(id: number): Promise<void>;

  // Calculator State
  getCalculatorState(): Promise<CalculatorState | undefined>;
  updateCalculatorState(state: Partial<InsertCalculatorState>): Promise<CalculatorState>;
}

export class DatabaseStorage implements IStorage {
  // Machine Settings
  async getMachineSettings(): Promise<MachineSettings | undefined> {
    const [settings] = await db.select().from(machineSettings).limit(1);
    return settings;
  }

  async updateMachineSettings(updates: Partial<InsertMachineSettings>): Promise<MachineSettings> {
    const [existing] = await db.select().from(machineSettings).limit(1);
    
    if (existing) {
      const [updated] = await db
        .update(machineSettings)
        .set(updates)
        .where(eq(machineSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(machineSettings)
        .values({
          ...updates,
          usbHorizontalDistance: updates.usbHorizontalDistance ?? 50.0,
          wheelCenterToHousingTop: updates.wheelCenterToHousingTop ?? 0.0,
        })
        .returning();
      return created;
    }
  }

  // Wheels
  async getWheels(): Promise<Wheel[]> {
    return await db.select().from(wheels).orderBy(desc(wheels.isActive), desc(wheels.createdAt));
  }

  async getWheel(id: number): Promise<Wheel | undefined> {
    const [wheel] = await db.select().from(wheels).where(eq(wheels.id, id));
    return wheel;
  }

  async createWheel(wheel: InsertWheel): Promise<Wheel> {
    const [created] = await db.insert(wheels).values(wheel).returning();
    return created;
  }

  async updateWheel(id: number, updates: Partial<InsertWheel>): Promise<Wheel> {
    const [updated] = await db
      .update(wheels)
      .set(updates)
      .where(eq(wheels.id, id))
      .returning();
    return updated;
  }

  async deleteWheel(id: number): Promise<void> {
    await db.delete(wheels).where(eq(wheels.id, id));
  }

  // Calculator State
  async getCalculatorState(): Promise<CalculatorState | undefined> {
    const [state] = await db.select().from(calculatorState).limit(1);
    return state;
  }

  async updateCalculatorState(updates: Partial<InsertCalculatorState>): Promise<CalculatorState> {
    const [existing] = await db.select().from(calculatorState).limit(1);
    
    if (existing) {
      const [updated] = await db
        .update(calculatorState)
        .set(updates)
        .where(eq(calculatorState.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(calculatorState)
        .values({
          ...updates,
          // Defaults handled by schema or ensure they are present if required
        })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
