import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WelcomePage() {
  return (
    <Card className="w-full border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          ML
        </div>
        <CardTitle>Welcome to Mini Linear</CardTitle>
        <CardDescription>
          Plan and track work with your team. Create a new workspace or sign in
          to an existing one.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "default" }), "w-full")}
        >
          Create workspace
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          Sign in
        </Link>
        <p className="text-center text-xs text-muted-foreground">
          Have an invite link? Open it directly to join or set up a workspace.
        </p>
      </CardContent>
    </Card>
  );
}
