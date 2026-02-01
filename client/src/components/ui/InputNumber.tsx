import { Input } from "./input";
import { Label } from "./label";
import { clsx } from "clsx";
import { Minus, Plus } from "lucide-react";
import { Button } from "./button";

interface InputNumberProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export function InputNumber({ label, unit, className, onIncrement, onDecrement, ...props }: InputNumberProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      <Label className="text-sm font-medium text-muted-foreground ml-1">{label}</Label>
      <div className="relative flex items-center group">
        <Input 
          type="number" 
          step="0.1"
          className="pr-12 h-14 text-lg font-medium tabular-nums shadow-sm bg-background border-border/60 hover:border-primary/40 focus:border-primary transition-all"
          {...props}
        />
        {unit && (
          <div className="absolute right-4 pointer-events-none text-muted-foreground text-sm font-medium">
            {unit}
          </div>
        )}
      </div>
      {(onIncrement || onDecrement) && (
        <div className="flex gap-2 mt-1">
          {onDecrement && (
            <Button variant="outline" size="sm" onClick={onDecrement} className="flex-1 h-8 text-muted-foreground">
              <Minus className="w-3 h-3" />
            </Button>
          )}
          {onIncrement && (
            <Button variant="outline" size="sm" onClick={onIncrement} className="flex-1 h-8 text-muted-foreground">
              <Plus className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
