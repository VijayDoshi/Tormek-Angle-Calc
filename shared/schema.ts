
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
  // Vertical distance from the machine datum to the wheel center (mm) — "VV" in TormekCalc.
  wheelCenterToHousingTop: real("wheel_center_to_housing_top").notNull().default(29.0),
  // USB bar diameter (mm) — "U" in TormekCalc, default 12mm for standard Tormek USB.
  usbDiameter: real("usb_diameter").notNull().default(12.0),
  // Jig diameter (mm) — "J", diameter of the knife jig resting on the USB bar. Default 12mm.
  jigDiameter: real("jig_diameter").notNull().default(12.0),
  
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
