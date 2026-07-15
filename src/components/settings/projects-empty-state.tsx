import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectsEmptyState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate?: () => void;
}) {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 text-muted-foreground/80">
        <Boxes className="mx-auto size-12 stroke-[1.25]" />
      </div>

      <h2 className="text-lg font-medium text-foreground">Projects</h2>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {canCreate
          ? "Projects are larger units of work with a clear outcome, such as a new feature you want to ship. They can be shared across your workspace and are made up of members working together."
          : "Projects group members around shared work in your workspace. Ask an admin or manager to create one when you're ready to get started."}
      </p>

      {canCreate && onCreate && (
        <Button
          className="mt-6 bg-violet-600 text-white hover:bg-violet-500"
          onClick={onCreate}
        >
          Create new project
        </Button>
      )}
    </div>
  );
}
