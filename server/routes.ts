
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { machineSettings, wheels, calculatorState } from "@shared/schema";
import { db } from "./db";

async function seedDatabase() {
  const existingSettings = await storage.getMachineSettings();
  if (!existingSettings) {
    await storage.updateMachineSettings({
      name: "Standard Tormek T8",
      usbHorizontalDistance: 50.0, // Default assumption, user can change
      wheelCenterToHousingTop: 0.0, 
      unit: "mm"
    });
  }

  const existingWheels = await storage.getWheels();
  if (existingWheels.length === 0) {
    await storage.createWheel({ name: "SG-250 (New)", diameter: 250.0, isActive: true });
    await storage.createWheel({ name: "Worn Wheel", diameter: 240.0, isActive: false });
    await storage.createWheel({ name: "Honing Wheel", diameter: 220.0, isActive: false });
  }

  const existingState = await storage.getCalculatorState();
  if (!existingState) {
    // Need a wheel ID first
    const [defaultWheel] = await storage.getWheels();
    if (defaultWheel) {
      await storage.updateCalculatorState({
        selectedWheelId: defaultWheel.id,
        targetAngle: 15.0,
        bladeProjection: 140.0
      });
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize seed data
  seedDatabase().catch(console.error);

  // Settings Routes
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getMachineSettings();
    if (!settings) {
      // Return defaults if not found (though seed should handle this)
      return res.json({
        id: 0,
        name: "Default",
        usbHorizontalDistance: 50.0,
        wheelCenterToHousingTop: 0.0,
        unit: "mm",
        createdAt: new Date().toISOString()
      });
    }
    res.json(settings);
  });

  app.put(api.settings.update.path, async (req, res) => {
    try {
      const input = api.settings.update.input.parse(req.body);
      const settings = await storage.updateMachineSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Wheels Routes
  app.get(api.wheels.list.path, async (req, res) => {
    const wheels = await storage.getWheels();
    res.json(wheels);
  });

  app.post(api.wheels.create.path, async (req, res) => {
    try {
      const input = api.wheels.create.input.parse(req.body);
      const wheel = await storage.createWheel(input);
      res.status(201).json(wheel);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.wheels.update.path, async (req, res) => {
    try {
      const input = api.wheels.update.input.parse(req.body);
      const wheel = await storage.updateWheel(Number(req.params.id), input);
      if (!wheel) {
        return res.status(404).json({ message: "Wheel not found" });
      }
      res.json(wheel);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.wheels.delete.path, async (req, res) => {
    await storage.deleteWheel(Number(req.params.id));
    res.status(204).send();
  });

  // Calculator State Routes
  app.get(api.state.get.path, async (req, res) => {
    const state = await storage.getCalculatorState();
    if (!state) return res.json({}); // Empty object if no state
    res.json(state);
  });

  app.put(api.state.update.path, async (req, res) => {
    const input = api.state.update.input.parse(req.body);
    const state = await storage.updateCalculatorState(input);
    res.json(state);
  });

  return httpServer;
}
