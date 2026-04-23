import { useEffect, useState, useMemo } from "react";
import { Layout } from "@/components/ui/Layout";
import { useSettings, useWheels, useCalculatorState, useUpdateState } from "@/hooks/use-tormek";
import { calculateUSBHeight } from "@/lib/tormek-math";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { InputNumber } from "@/components/ui/InputNumber";
import { Loader2, Ruler, Triangle, CircleDashed } from "lucide-react";

function Calculator() {
  const { data: settings } = useSettings();
  const { data: wheels } = useWheels();
  const { data: savedState, isLoading: isStateLoading } = useCalculatorState();
  const updateState = useUpdateState();

  // Local state for immediate UI response
  const [wheelId, setWheelId] = useState<string>("");
  const [customDiameter, setCustomDiameter] = useState<string>("250");
  const [projection, setProjection] = useState<string>("140");
  const [angle, setAngle] = useState<string>("15");

  const activeWheel = useMemo(() => 
    wheels?.find(w => w.id === Number(wheelId)), 
  [wheels, wheelId]);

  // Sync with loaded state once
  useEffect(() => {
    if (savedState && !isStateLoading) {
      if (savedState.selectedWheelId) setWheelId(String(savedState.selectedWheelId));
      if (savedState.bladeProjection) setProjection(String(savedState.bladeProjection));
      if (savedState.targetAngle) setAngle(String(savedState.targetAngle));
    }
  }, [savedState, isStateLoading]);

  // Sync custom diameter when wheel changes
  useEffect(() => {
    if (activeWheel) {
      setCustomDiameter(String(activeWheel.diameter));
    }
  }, [activeWheel]);

  // Derive result
  const result = useMemo(() => {
    if (!settings || !wheels || !wheelId) return null;
    
    const d = parseFloat(customDiameter);
    const p = parseFloat(projection);
    const a = parseFloat(angle);

    if (isNaN(d) || isNaN(p) || isNaN(a)) return null;

    return calculateUSBHeight({
      wheelDiameter: d,
      projection: p,
      targetAngle: a,
      usbHorizontalDist: settings.usbHorizontalDistance,
      housingOffset: settings.wheelCenterToHousingTop,
      usbDiameter: settings.usbDiameter ?? 12,
    });
  }, [settings, wheels, wheelId, customDiameter, projection, angle]);

  // Debounce updates to backend
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isStateLoading && wheelId) {
        updateState.mutate({
          selectedWheelId: Number(wheelId),
          bladeProjection: parseFloat(projection) || 0,
          targetAngle: parseFloat(angle) || 0,
          lastResult: result ?? undefined,
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [wheelId, projection, angle, result, isStateLoading]);

  if (!settings || !wheels || isStateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout title="Calculator">
      <div className="space-y-8">
        
        {/* RESULT CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-2xl shadow-primary/20 transition-all duration-300">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10 text-center space-y-2">
            <h2 className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider">Required USB Height</h2>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-7xl font-bold font-display tracking-tight">
                {result !== null ? result.toFixed(1) : "--"}
              </span>
              <span className="text-xl text-primary-foreground/50 font-medium">mm</span>
            </div>
            {result === null && (wheelId ? (
              <p className="text-sm text-red-300 mt-2">Invalid Geometry</p>
            ) : (
              <p className="text-sm text-primary-foreground/50 mt-2">Select a wheel to start</p>
            ))}
          </div>
        </div>

        {/* INPUTS */}
        <div className="grid gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wheel Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground ml-1">Grinding Wheel</Label>
              <Select value={wheelId} onValueChange={setWheelId}>
                <SelectTrigger className="h-14 rounded-xl border-border/60 bg-white/50 dark:bg-black/20 text-lg font-medium shadow-sm">
                  <SelectValue placeholder="Select Wheel" />
                </SelectTrigger>
                <SelectContent>
                  {wheels.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)} className="text-base py-3">
                      <span className="font-medium">{w.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Diameter */}
            <InputNumber
              label="Current Diameter"
              unit="mm"
              value={customDiameter}
              onChange={(e) => setCustomDiameter(e.target.value)}
              onIncrement={() => setCustomDiameter((p) => String((parseFloat(p) + 1).toFixed(1)))}
              onDecrement={() => setCustomDiameter((p) => String((parseFloat(p) - 1).toFixed(1)))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputNumber
              label="Target Angle"
              unit="°"
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              onIncrement={() => setAngle((p) => String(parseFloat(p) + 1))}
              onDecrement={() => setAngle((p) => String(parseFloat(p) - 1))}
            />
            
            <InputNumber
              label="Projection"
              unit="mm"
              value={projection}
              onChange={(e) => setProjection(e.target.value)}
              onIncrement={() => setProjection((p) => String(parseFloat(p) + 1))}
              onDecrement={() => setProjection((p) => String(parseFloat(p) - 1))}
            />
          </div>

          {/* VISUAL EXPLANATION */}
          <Card className="p-6 bg-secondary/30 border-none shadow-none rounded-2xl">
             <div className="flex gap-6 text-sm text-muted-foreground">
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-background rounded-lg text-primary"><Triangle className="w-4 h-4" /></div>
                 <span>Target Bevel</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="p-2 bg-background rounded-lg text-primary"><Ruler className="w-4 h-4" /></div>
                 <span>Blade Length</span>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default Calculator;
