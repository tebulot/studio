
'use client';

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react"; // Or any other icon you prefer
import { useBackgroundAnimation } from "@/contexts/BackgroundAnimationContext";

export default function BackgroundAnimationToggle() {
  const { isAnimationEnabled, toggleAnimation } = useBackgroundAnimation();

  return (
    <div className="flex items-center space-x-2">
      <Sparkles className={`h-4 w-4 transition-colors ${isAnimationEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
      <Switch
        id="background-animation-toggle"
        checked={isAnimationEnabled}
        onCheckedChange={toggleAnimation}
        aria-label="Toggle background animation"
      />
      {/* <Label htmlFor="background-animation-toggle" className="text-xs text-muted-foreground hidden sm:inline">
        FX
      </Label> */}
    </div>
  );
}
