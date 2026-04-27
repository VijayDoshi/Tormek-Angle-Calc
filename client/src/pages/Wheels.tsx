import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { useWheels, useCreateWheel, useDeleteWheel, useUpdateWheel } from "@/hooks/use-tormek";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, Disc, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InsertWheel } from "@shared/schema";

// Schema for form validation
const wheelFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  diameter: z.coerce.number().min(50, "Diameter must be > 50mm").max(300, "Diameter too large"),
});

export default function WheelsPage() {
  const { data: wheels, isLoading } = useWheels();
  const deleteWheel = useDeleteWheel();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWheel, setEditingWheel] = useState<{id: number, name: string, diameter: number} | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout 
      title="My Wheels" 
      action={
        <Button onClick={() => setIsCreateOpen(true)} size="icon" className="h-10 w-10 rounded-full shadow-md bg-primary hover:bg-primary/90">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </Button>
      }
    >
      <div className="space-y-4 pb-20">
        {!wheels?.length ? (
          <div className="text-center py-20 text-muted-foreground space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Disc className="w-8 h-8 opacity-50" />
            </div>
            <p>No wheels added yet.</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Add your first wheel</Button>
          </div>
        ) : (
          wheels.map((wheel) => (
            <Card key={wheel.id} className="group overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300">
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center shadow-inner">
                     <span className="text-xs font-bold text-muted-foreground">{Math.round(wheel.diameter)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{wheel.name}</h3>
                    <p className="text-sm text-muted-foreground">Diameter: {wheel.diameter}mm</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setEditingWheel(wheel)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm("Delete this wheel?")) {
                        deleteWheel.mutate(wheel.id);
                        toast({ title: "Wheel deleted" });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}

        {/* CREATE DIALOG */}
        <WheelDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen} 
          mode="create" 
        />

        {/* EDIT DIALOG */}
        <WheelDialog 
          open={!!editingWheel} 
          onOpenChange={(open) => !open && setEditingWheel(null)} 
          mode="edit" 
          defaultValues={editingWheel || undefined} 
        />
      </div>
    </Layout>
  );
}

function WheelDialog({ open, onOpenChange, mode, defaultValues }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  mode: "create" | "edit";
  defaultValues?: { id?: number; name: string; diameter: number };
}) {
  const createWheel = useCreateWheel();
  const updateWheel = useUpdateWheel();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof wheelFormSchema>>({
    resolver: zodResolver(wheelFormSchema),
    defaultValues: {
      name: "",
      diameter: 250,
    },
    values: defaultValues ? { name: defaultValues.name, diameter: defaultValues.diameter } : undefined,
  });

  const onSubmit = (data: z.infer<typeof wheelFormSchema>) => {
    if (mode === "create") {
      createWheel.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast({ title: "Wheel created successfully" });
        },
      });
    } else if (mode === "edit" && defaultValues?.id) {
      updateWheel.mutate({ id: defaultValues.id, ...data }, {
        onSuccess: () => {
          onOpenChange(false);
          toast({ title: "Wheel updated" });
        }
      });
    }
  };

  const isPending = createWheel.isPending || updateWheel.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Wheel" : "Edit Wheel"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wheel Name</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Standard SG-250" className="h-12" />
              {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="diameter">Diameter (mm)</Label>
              <Input id="diameter" type="number" inputMode="decimal" step="0.1" {...form.register("diameter")} className="h-12" />
              {form.formState.errors.diameter && <p className="text-xs text-destructive">{form.formState.errors.diameter.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending} className="bg-primary text-primary-foreground shadow-lg">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "create" ? "Add Wheel" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
