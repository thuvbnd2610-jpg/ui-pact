import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Navisoft — Quản lý phân quyền
        </h1>
        <p className="mt-3 text-muted-foreground">
          Cấu hình quyền chức năng và dữ liệu theo cấu trúc phân cấp cha–con rõ ràng,
          dễ đọc.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link to="/permissions">
              Mở màn phân quyền <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
