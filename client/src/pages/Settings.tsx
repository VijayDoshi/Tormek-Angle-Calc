import { Layout } from "@/components/ui/Layout";
import { useSettings, useUpdateSettings } from "@/hooks/use-tormek";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Ruler, ArrowRightLeft, ArrowUpFromLine } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const settingsSchema = z.object({
  usbHorizontalDistance: z.coerce.number().min(0, "Must be positive"),
  wheelCenterToHousingTop: z.coerce.number(),
  usbDiameter: z.coerce.number().min(0.1, "Must be positive"),
  name: z.string().min(1, "Name required"),
});

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      usbHorizontalDistance: 50,
      wheelCenterToHousingTop: 29,
      usbDiameter: 12,
      name: "My Tormek",
    },
  });

  // Load initial data
  useEffect(() => {
    if (settings) {
      form.reset({
        usbHorizontalDistance: settings.usbHorizontalDistance,
        wheelCenterToHousingTop: settings.wheelCenterToHousingTop,
        usbDiameter: settings.usbDiameter ?? 12,
        name: settings.name,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: z.infer<typeof settingsSchema>) => {
    updateSettings.mutate(data, {
      onSuccess: () => toast({ title: "Settings saved successfully" }),
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout title="Machine Settings">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Card className="steel-card border-none">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Calibrate for your specific machine geometry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                Machine Name
              </Label>
              <Input {...form.register("name")} className="bg-card border border-border" />
            </div>
            
            <Separator />

            <div className="space-y-4">
               <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-primary" />
                  Horizontal Distance (Center-to-USB)
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.1" 
                    {...form.register("usbHorizontalDistance")} 
                    className="pr-12 bg-card border border-border"
                  />
                  <span className="absolute right-4 top-2.5 text-sm text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Distance from the center of the wheel shaft horizontally to the center of the USB leg. Standard is often around 50mm-60mm or ~223mm depending on mount.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ArrowUpFromLine className="w-4 h-4 text-primary" />
                  Vertical Offset VV (Datum to Wheel Center)
                </Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    step="0.1" 
                    {...form.register("wheelCenterToHousingTop")} 
                    className="pr-12 bg-card border border-border"
                    data-testid="input-vv"
                  />
                  <span className="absolute right-4 top-2.5 text-sm text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vertical distance from the machine datum (top of housing) to the wheel center. TormekCalc default is ~29mm.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-primary" />
                  USB Bar Diameter (U)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    {...form.register("usbDiameter")}
                    className="pr-12 bg-card border border-border"
                    data-testid="input-usb-diameter"
                  />
                  <span className="absolute right-4 top-2.5 text-sm text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Diameter of the Universal Support Bar. Standard Tormek USB is 12mm.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={updateSettings.isPending}
          className="w-full h-14 text-lg rounded-xl shadow-lg bg-primary text-primary-foreground hover:translate-y-[-2px] transition-transform"
        >
          {updateSettings.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 w-5 h-5" />}
          Save Configuration
        </Button>

      </form>
    </Layout>
  );
}
