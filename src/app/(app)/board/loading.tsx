import { Loader2 } from "lucide-react";

export default function BoardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
