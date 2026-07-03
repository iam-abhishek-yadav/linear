import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md border-border/60 bg-panel shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <CardHeader>
          <CardTitle>Invite required</CardTitle>
          <CardDescription>
            Workspace registration is invite-only. Use the link from your invite
            email to create your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
