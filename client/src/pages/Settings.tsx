import { useState, useEffect, forwardRef } from "react";
import { Layout } from "@/components/ui/Layout";
import {
  useMachines,
  useActiveMachineId,
  useCreateMachine,
  useUpdateMachine,
  useDeleteMachine,
  useSetActiveMachine,
  type Machine,
} from "@/hooks/use-tormek";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Save, Loader2, Settings2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const machineFormSchema = z.object({
  name: z.string().min(1, "Name required"),
  usbHorizontalDistance: z.coerce.number().min(0, "Must be positive"),
  wheelCenterToHousingTop: z.coerce.number(),
  usbDiameter: z.coerce.number().min(0.1, "Must be positive"),
  jigDiameter: z.coerce.number().min(0, "Must be 0 or positive"),
});

type MachineFormValues = z.infer<typeof machineFormSchema>;

const DEFAULT_FORM: MachineFormValues = {
  name: "",
  usbHorizontalDistance: 50,
  wheelCenterToHousingTop: 29,
  usbDiameter: 12,
  jigDiameter: 12,
};

export default function SettingsPage() {
  const { data: machines, isLoading } = useMachines();
  const { data: activeMachineId = 1 } = useActiveMachineId();
  const setActive = useSetActiveMachine();
  const deleteMachine = useDeleteMachine();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout
      title="Machines"
      action={
        <Button
          onClick={() => setIsCreateOpen(true)}
          size="icon"
          className="h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90"
          data-testid="button-add-machine"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </Button>
      }
    >
      <div className="space-y-4 pb-20">
        {!machines?.length ? (
          <div className="text-center py-20 text-muted-foreground space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Settings2 className="w-8 h-8 opacity-50" />
            </div>
            <p>No machines configured yet.</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              Add your first machine
            </Button>
          </div>
        ) : (
          machines.map((machine) => {
            const isActive = machine.id === activeMachineId;
            return (
              <Card
                key={machine.id}
                className={`overflow-hidden transition-all duration-300 ${
                  isActive
                    ? "border-primary/50 shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]"
                    : "border-border/50 hover:border-primary/20"
                }`}
                data-testid={`card-machine-${machine.id}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-inner shrink-0">
                        <Settings2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg leading-tight">{machine.name}</h3>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          HV {machine.usbHorizontalDistance}mm · VV {machine.wheelCenterToHousingTop}mm · U {machine.usbDiameter}mm · J {machine.jigDiameter ?? 12}mm
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditingMachine(machine)}
                        data-testid={`button-edit-machine-${machine.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={machines.length <= 1}
                        onClick={() => {
                          if (confirm(`Delete "${machine.name}"?`)) {
                            deleteMachine.mutate(machine.id, {
                              onSuccess: () => toast({ title: "Machine deleted" }),
                              onError: (e) =>
                                toast({ title: (e as Error).message, variant: "destructive" }),
                            });
                          }
                        }}
                        data-testid={`button-delete-machine-${machine.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full text-xs"
                      onClick={() =>
                        setActive.mutate(machine.id, {
                          onSuccess: () => toast({ title: `${machine.name} is now active` }),
                        })
                      }
                      data-testid={`button-set-active-${machine.id}`}
                    >
                      Use This Machine
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}

        <MachineDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} mode="create" />

        <MachineDialog
          key={editingMachine?.id ?? "edit-closed"}
          open={!!editingMachine}
          onOpenChange={(open) => !open && setEditingMachine(null)}
          mode="edit"
          defaultValues={editingMachine ?? undefined}
        />
      </div>
    </Layout>
  );
}

function MachineDialog({
  open,
  onOpenChange,
  mode,
  defaultValues,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultValues?: Machine;
}) {
  const createMachine = useCreateMachine();
  const updateMachine = useUpdateMachine();
  const { toast } = useToast();

  const form = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: DEFAULT_FORM,
  });

  // Populate fields whenever the dialog opens with existing data
  useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        name: defaultValues.name,
        usbHorizontalDistance: defaultValues.usbHorizontalDistance,
        wheelCenterToHousingTop: defaultValues.wheelCenterToHousingTop,
        usbDiameter: defaultValues.usbDiameter,
        jigDiameter: defaultValues.jigDiameter ?? 12,
      });
    } else if (open && !defaultValues) {
      form.reset(DEFAULT_FORM);
    }
  }, [open, defaultValues]);

  const onSubmit = (data: MachineFormValues) => {
    if (mode === "create") {
      createMachine.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset(DEFAULT_FORM);
          toast({ title: "Machine added" });
        },
      });
    } else if (mode === "edit" && defaultValues?.id) {
      updateMachine.mutate(
        { id: defaultValues.id, ...data },
        {
          onSuccess: () => {
            onOpenChange(false);
            toast({ title: "Machine updated" });
          },
        },
      );
    }
  };

  const isPending = createMachine.isPending || updateMachine.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Machine" : "Edit Machine"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Machine Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="e.g. Tormek T8"
              className="h-12"
              data-testid="input-machine-name"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Geometry Constants
            </p>

            <FieldRow
              id="hv"
              label="Horizontal Distance (HV)"
              description="Wheel center → USB axis"
              unit="mm"
              {...form.register("usbHorizontalDistance")}
              error={form.formState.errors.usbHorizontalDistance?.message}
            />

            <FieldRow
              id="vv"
              label="Vertical Offset (VV)"
              description="Housing datum → wheel center"
              unit="mm"
              {...form.register("wheelCenterToHousingTop")}
              error={form.formState.errors.wheelCenterToHousingTop?.message}
            />

            <FieldRow
              id="u"
              label="USB Bar Diameter (U)"
              description="Standard Tormek USB is 12mm"
              unit="mm"
              {...form.register("usbDiameter")}
              error={form.formState.errors.usbDiameter?.message}
            />

            <FieldRow
              id="j"
              label="Jig Diameter (J)"
              description="Knife jig on the USB bar. Use 0 for direct-on-bar."
              unit="mm"
              {...form.register("jigDiameter")}
              error={form.formState.errors.jigDiameter?.message}
            />
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground shadow-lg"
              data-testid="button-save-machine"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              {mode === "create" ? "Add Machine" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const FieldRow = forwardRef<
  HTMLInputElement,
  {
    id: string;
    label: string;
    description: string;
    unit: string;
    error?: string;
  } & React.InputHTMLAttributes<HTMLInputElement>
>(function FieldRow({ id, label, description, unit, error, ...inputProps }, ref) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.1"
          className="pr-12 h-12"
          data-testid={`input-${id}`}
          ref={ref}
          {...inputProps}
        />
        <span className="absolute right-4 top-3.5 text-sm text-muted-foreground">{unit}</span>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
});
