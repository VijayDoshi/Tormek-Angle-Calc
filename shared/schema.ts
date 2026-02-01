
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// Stores the machine configuration (Tormek T8 constants)
export const machineSettings = pgTable("machine_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("My Tormek T8"),
  // Horizontal distance from wheel center to USB post center (mm)
  usbHorizontalDistance: real("usb_horizontal_distance").notNull().default(50.0), 
  // Vertical offset if any (usually 0 for Tormek vertical mount relative to some datum, but let's keep it simple)
  // We'll assume the calculation wants "Height from Wheel Center" or "Height from Housing".
  // Let's stick to "Height from Housing" and ask for "Wheel Center to Housing Top" distance.
  wheelCenterToHousingTop: real("wheel_center_to_housing_top").notNull().default(0.0),
  
  // Default measurement units preference
  unit: text("unit").notNull().default("mm"), // 'mm' or 'inch'
  createdAt: timestamp("created_at").defaultNow(),
});

// Stores different grinding wheels (they wear down, so diameter changes)
export const wheels = pgTable("wheels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Standard SG-250"),
  diameter: real("diameter").notNull().default(250.0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stores the last used calculator state for "session persistence"
export const calculatorState = pgTable("calculator_state", {
  id: serial("id").primaryKey(),
  selectedWheelId: integer("selected_wheel_id").references(() => wheels.id),
  targetAngle: real("target_angle").default(15.0),
  bladeProjection: real("blade_projection").default(140.0),
  lastResult: real("last_result"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHEMAS ===
export const insertMachineSettingsSchema = createInsertSchema(machineSettings).omit({ id: true, createdAt: true });
export const insertWheelSchema = createInsertSchema(wheels).omit({ id: true, createdAt: true });
export const insertCalculatorStateSchema = createInsertSchema(calculatorState).omit({ id: true, updatedAt: true });

// === TYPES ===
export type MachineSettings = typeof machineSettings.$inferSelect;
export type InsertMachineSettings = z.infer<typeof insertMachineSettingsSchema>;

export type Wheel = typeof wheels.$inferSelect;
export type InsertWheel = z.infer<typeof insertWheelSchema>;

export type CalculatorState = typeof calculatorState.$inferSelect;
export type InsertCalculatorState = z.infer<typeof insertCalculatorStateSchema>;

// API Payload Types
export type UpdateStateRequest = Partial<InsertCalculatorState>;
