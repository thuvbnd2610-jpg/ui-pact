import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  RotateCcw,
  Save,
  Shield,
  Database,
  Boxes,
  Folder,
  FileText,
  Check,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: "Quản lý phân quyền | Navisoft" },
      {
        name: "description",
        content:
          "Cấu hình quyền truy cập chức năng và dữ liệu cho từng nhóm người dùng theo cấu trúc phân cấp rõ ràng.",
      },
      { property: "og:title", content: "Quản lý phân quyền | Navisoft" },
      {
        property: "og:description",
        content:
          "Cấu hình quyền chức năng và dữ liệu theo nhóm người dùng với cây phân cấp trực quan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PermissionsPage,
});

type FunctionNode = {
  code: string;
  name: string;
  description?: string;
  children?: FunctionNode[];
};

const FUNCTION_TREE: FunctionNode[] = [
  {
    code: "WORKSPACE",
    name: "Workspace",
    description: "Không gian làm việc chung",
    children: [
      { code: "DASHBOARD", name: "Tổng quan", description: "Bảng điều khiển tổng quan" },
      {
        code: "PROJECTS",
        name: "Dự án",
        description: "Quản lý dự án",
        children: [
          { code: "PROJECTS_VIEW_ALL", name: "Xem tất cả dự án" },
          { code: "PROJECTS_ADMIN", name: "Quản trị dự án" },
        ],
      },
      { code: "PERFORMANCE", name: "Hiệu suất" },
    ],
  },
  {
    code: "SYSTEM",
    name: "Hệ thống",
    description: "Quản trị hệ thống",
    children: [
      {
        code: "SYS_ADMIN",
        name: "Quản trị hệ thống",
        children: [
          { code: "USER_MGMT", name: "Quản lý NSD" },
          { code: "ROLE_MGMT", name: "Quản lý nhóm NSD" },
          { code: "PERMISSION_MGMT", name: "Quản lý phân quyền" },
        ],
      },
      {
        code: "IMPORT",
        name: "Import dữ liệu",
        children: [
          { code: "RESOURCE_IMPORT_PLAN", name: "Import nguồn lực - kế hoạch" },
          { code: "RESOURCE_IMPORT_ACTUAL", name: "Import nguồn lực - thực tế" },
          { code: "RESOURCE_IMPORT_FINANCE", name: "Import nguồn lực tài chính" },
        ],
      },
      { code: "AUDIT_TRAIL", name: "Lịch sử thao tác" },
    ],
  },
  {
    code: "TIMEKEEPING_ADMIN",
    name: "Chấm công",
    children: [
      {
        code: "TIMEKEEPING",
        name: "Danh sách chấm công",
        children: [{ code: "TIMEKEEPING_CONFIG", name: "Cấu hình chấm công" }],
      },
    ],
  },
  {
    code: "HR_ADMIN",
    name: "Quản lý nhân sự",
    children: [
      {
        code: "HR_PROFILE",
        name: "Thông tin cá nhân",
        children: [{ code: "HR_PROFILE_VIEW", name: "Xem hồ sơ nhân sự" }],
      },
      { code: "DEPARTMENT", name: "Danh sách phòng ban" },
      { code: "EMPLOYEE", name: "Danh sách nhân sự" },
      { code: "CUSTOMER", name: "Danh sách khách hàng" },
      { code: "CANDIDATE", name: "Danh sách ứng viên" },
      { code: "PROJECT_LIST", name: "Danh sách dự án" },
    ],
  },
];

const ACTIONS = ["query", "create", "update", "delete"] as const;
type Action = (typeof ACTIONS)[number];
const ACTION_LABEL: Record<Action, string> = {
  query: "Truy vấn",
  create: "Thêm",
  update: "Sửa",
  delete: "Xóa",
};

type DataPerm = "hidden" | "readonly" | "editable";

const DATA_FIELDS: {
  object: string;
  code: string;
  name: string;
  type: string;
}[] = [
  { object: "PROJECT", code: "FLD_PRJ_PRIORITY", name: "Độ ưu tiên", type: "C" },
  { object: "PROJECT", code: "FLD_PRJ_NOTE", name: "Ghi chú", type: "C" },
  { object: "PROJECT", code: "FLD_PRJ_TYPE", name: "Loại dự án", type: "C" },
  { object: "PROJECT", code: "FLD_PRJ_MILESTONES", name: "Milestone dự án", type: "C" },
  { object: "PROJECT", code: "FLD_PRJ_GOLIVE", name: "Ngày go-live dự kiến", type: "D" },
  { object: "PROJECT", code: "FLD_PRJ_BUDGET_PLAN", name: "Ngân sách - Kế hoạch (VND)", type: "N" },
  { object: "PROJECT", code: "FLD_PRJ_BUDGET_ACTUAL", name: "Ngân sách - Thực tế (VND)", type: "N" },
  { object: "PROJECT", code: "FLD_PRJ_RESOURCE_PLAN", name: "Nguồn lực - Kế hoạch (MD)", type: "N" },
  { object: "PROJECT", code: "FLD_PRJ_RESOURCE_ACTUAL", name: "Nguồn lực - Thực tế (MD)", type: "N" },
  { object: "PROJECT", code: "FLD_PRJ_RESOURCES", name: "Nhân sự dự án", type: "C" },
];

type PermState = Record<string, Record<Action, boolean>>;

function flattenCodes(nodes: FunctionNode[]): string[] {
  const out: string[] = [];
  const walk = (n: FunctionNode) => {
    out.push(n.code);
    n.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return out;
}

function getDescendants(node: FunctionNode): string[] {
  const out: string[] = [];
  const walk = (n: FunctionNode) => {
    n.children?.forEach((c) => {
      out.push(c.code);
      walk(c);
    });
  };
  walk(node);
  return out;
}

function PermissionsPage() {
  const [group, setGroup] = useState("hrm");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FUNCTION_TREE.map((n) => [n.code, true])),
  );

  const initialPerms = useMemo<PermState>(() => {
    const base: PermState = {};
    flattenCodes(FUNCTION_TREE).forEach((c) => {
      base[c] = { query: false, create: false, update: false, delete: false };
    });
    // Seed a few like the reference
    ["TIMEKEEPING_ADMIN", "TIMEKEEPING", "HR_ADMIN", "HR_PROFILE"].forEach((c) => {
      base[c] = { ...base[c], query: true };
    });
    return base;
  }, []);

  const [perms, setPerms] = useState<PermState>(initialPerms);
  const [dataPerms, setDataPerms] = useState<Record<string, DataPerm>>({});

  const toggleExpanded = (code: string) =>
    setExpanded((e) => ({ ...e, [code]: !e[code] }));

  const setPerm = (code: string, action: Action, value: boolean) =>
    setPerms((p) => ({ ...p, [code]: { ...p[code], [action]: value } }));

  const setBranchPerm = (node: FunctionNode, action: Action, value: boolean) => {
    const codes = [node.code, ...getDescendants(node)];
    setPerms((p) => {
      const next = { ...p };
      codes.forEach((c) => {
        next[c] = { ...next[c], [action]: value };
      });
      return next;
    });
  };

  const branchState = (
    node: FunctionNode,
    action: Action,
  ): "all" | "some" | "none" => {
    const codes = [node.code, ...getDescendants(node)];
    const on = codes.filter((c) => perms[c]?.[action]).length;
    if (on === 0) return "none";
    if (on === codes.length) return "all";
    return "some";
  };

  const matchesSearch = (n: FunctionNode): boolean => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    if (n.code.toLowerCase().includes(q) || n.name.toLowerCase().includes(q)) return true;
    return n.children?.some(matchesSearch) ?? false;
  };

  const visibleTree = useMemo(
    () => FUNCTION_TREE.filter(matchesSearch),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search],
  );
  const visibleCodes = useMemo(() => flattenCodes(visibleTree), [visibleTree]);

  const columnState = (a: Action): "all" | "some" | "none" => {
    if (visibleCodes.length === 0) return "none";
    const on = visibleCodes.filter((c) => perms[c]?.[a]).length;
    if (on === 0) return "none";
    if (on === visibleCodes.length) return "all";
    return "some";
  };

  const setColumnPerm = (a: Action, value: boolean) => {
    setPerms((p) => {
      const next = { ...p };
      visibleCodes.forEach((c) => {
        next[c] = { ...next[c], [a]: value };
      });
      return next;
    });
  };

  const rowState = (node: FunctionNode): "all" | "some" | "none" => {
    const codes = [node.code, ...getDescendants(node)];
    let on = 0;
    let total = 0;
    codes.forEach((c) => {
      ACTIONS.forEach((a) => {
        total += 1;
        if (perms[c]?.[a]) on += 1;
      });
    });
    if (on === 0) return "none";
    if (on === total) return "all";
    return "some";
  };

  const setRowPerm = (node: FunctionNode, value: boolean) => {
    const codes = [node.code, ...getDescendants(node)];
    setPerms((p) => {
      const next = { ...p };
      codes.forEach((c) => {
        next[c] = { query: value, create: value, update: value, delete: value };
      });
      return next;
    });
  };

  const allState = (): "all" | "some" | "none" => {
    const allCodes = flattenCodes(FUNCTION_TREE);
    let on = 0;
    let total = 0;
    allCodes.forEach((c) => {
      ACTIONS.forEach((a) => {
        total += 1;
        if (perms[c]?.[a]) on += 1;
      });
    });
    if (on === 0) return "none";
    if (on === total) return "all";
    return "some";
  };

  const setAllPerm = (value: boolean) => {
    const allCodes = flattenCodes(FUNCTION_TREE);
    setPerms((p) => {
      const next = { ...p };
      allCodes.forEach((c) => {
        next[c] = { query: value, create: value, update: value, delete: value };
      });
      return next;
    });
  };

  const reset = () => {
    setPerms(initialPerms);
    setDataPerms({});
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Navisoft / Quản trị hệ thống
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Quản lý phân quyền
            </h1>
          </div>
          <div className="relative w-80 max-w-[40vw]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm dự án, nhân sự, mã JIRA..."
              className="pl-9"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-6 py-6">
        {/* Filters */}
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Bộ lọc phân quyền</h2>
            <p className="text-sm text-muted-foreground">
              Chọn nhóm người dùng và tìm chức năng cần cấu hình
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nhóm người dùng</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="hrm">Nhân viên (HRM)</SelectItem>
                  <SelectItem value="pm">Quản lý dự án</SelectItem>
                  <SelectItem value="finance">Tài chính</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tìm theo tên / mã chức năng</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="VD: SYS_USER hoặc Chấm công"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="on">Đã cấp quyền</SelectItem>
                  <SelectItem value="off">Chưa cấp quyền</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>
              <RotateCcw /> Đặt lại
            </Button>
            <Button>
              <Save /> Lưu quyền
            </Button>
          </div>
        </section>

        {/* Tabs */}
        <Tabs defaultValue="function">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="function" className="gap-2">
              <Shield className="h-4 w-4" /> Phân quyền chức năng
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" /> Phân quyền dữ liệu
            </TabsTrigger>
          </TabsList>

          {/* FUNCTION PERMISSIONS */}
          <TabsContent value="function" className="mt-4">
            <div className="overflow-hidden rounded-xl border-2 bg-card shadow-sm">
              {/* Legend header */}
              <div className="flex items-center justify-between border-b-2 bg-muted/40 px-5 py-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="h-3.5 w-3.5 text-amber-600" /> Module chính
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Folder className="h-3.5 w-3.5 text-amber-500" /> Nhóm chức năng
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-sky-600" /> Chức năng chi tiết
                  </span>
                </div>
                <div className="hidden items-center gap-6 pr-4 text-xs font-medium text-muted-foreground md:flex">
                  <div className="flex w-14 flex-col items-center gap-1 border-r-2 border-r-foreground/25 pr-3">
                    <span className="text-[11px] text-muted-foreground/80">ALL</span>
                    {(() => {
                      const ast = allState();
                      return (
                        <button
                          type="button"
                          onClick={() => setAllPerm(ast !== "all")}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                            ast === "all"
                              ? "border-primary bg-primary text-primary-foreground"
                              : ast === "some"
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-input bg-background hover:border-primary/60",
                          )}
                          title="Chọn tất cả quyền"
                          aria-label="Chọn tất cả quyền"
                        >
                          {ast === "all" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : ast === "some" ? (
                            <Minus className="h-3.5 w-3.5" />
                          ) : null}
                        </button>
                      );
                    })()}
                  </div>
                  {ACTIONS.map((a) => {
                    const st = columnState(a);
                    return (
                      <div key={a} className="flex w-14 flex-col items-center gap-1">
                        <span>{ACTION_LABEL[a]}</span>
                        <button
                          type="button"
                          onClick={() => setColumnPerm(a, st !== "all")}
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                            st === "all"
                              ? "border-primary bg-primary text-primary-foreground"
                              : st === "some"
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-input bg-background hover:border-primary/60",
                          )}
                          title={`Chọn tất cả cột ${ACTION_LABEL[a]}`}
                          aria-label={`Chọn tất cả cột ${ACTION_LABEL[a]}`}
                        >
                          {st === "all" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : st === "some" ? (
                            <Minus className="h-3.5 w-3.5" />
                          ) : null}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ul className="divide-y-2">
                {visibleTree.map((node) => (
                  <TreeRow
                    key={node.code}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    onToggle={toggleExpanded}
                    perms={perms}
                    setPerm={setPerm}
                    setBranchPerm={setBranchPerm}
                    branchState={branchState}
                    rowState={rowState}
                    setRowPerm={setRowPerm}
                    matchesSearch={matchesSearch}
                  />
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* DATA PERMISSIONS */}
          <TabsContent value="data" className="mt-4">
            <div className="overflow-hidden rounded-xl border-2 bg-card shadow-sm">
              <div className="flex items-center border-b-2 bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground">
                <span className="w-28">Object</span>
                <span className="flex-1">Mã trường</span>
                <span className="flex-1">Tên trường</span>
                <span className="w-14 text-center">Kiểu</span>
                <span className="w-20 text-center">Ẩn</span>
                <span className="w-24 text-center">Chỉ xem</span>
                <span className="w-24 text-center">Cho sửa</span>
              </div>
              <ul className="divide-y-2">
                {DATA_FIELDS.filter((f) => {
                  if (!search.trim()) return true;
                  const q = search.toLowerCase();
                  return (
                    f.object.toLowerCase().includes(q) ||
                    f.code.toLowerCase().includes(q) ||
                    f.name.toLowerCase().includes(q)
                  );
                }).map((f) => {
                  const val = dataPerms[f.code] ?? "hidden";
                  return (
                    <li
                      key={f.code}
                      className="flex items-center px-5 py-2.5 transition-colors hover:bg-accent/40"
                    >
                      <span className="w-28 truncate text-sm font-medium text-blue-600">
                        {f.object}
                      </span>
                      <span className="flex-1 truncate font-mono text-sm text-foreground/90">
                        {f.code}
                      </span>
                      <span className="flex-1 truncate text-sm text-foreground/90">
                        {f.name}
                      </span>
                      <span className="w-14 text-center text-sm text-muted-foreground">
                        {f.type}
                      </span>
                      <span className="flex w-20 justify-center">
                        <button
                          type="button"
                          onClick={() => setDataPerms((p) => ({ ...p, [f.code]: "hidden" }))}
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                            val === "hidden"
                              ? "border-primary bg-primary"
                              : "border-input bg-background hover:border-primary/60",
                          )}
                          aria-label={`Ẩn - ${f.name}`}
                        >
                          {val === "hidden" && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </button>
                      </span>
                      <span className="flex w-24 justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDataPerms((p) => ({ ...p, [f.code]: "readonly" }))
                          }
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                            val === "readonly"
                              ? "border-primary bg-primary"
                              : "border-input bg-background hover:border-primary/60",
                          )}
                          aria-label={`Chỉ xem - ${f.name}`}
                        >
                          {val === "readonly" && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </button>
                      </span>
                      <span className="flex w-24 justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDataPerms((p) => ({ ...p, [f.code]: "editable" }))
                          }
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors",
                            val === "editable"
                              ? "border-primary bg-primary"
                              : "border-input bg-background hover:border-primary/60",
                          )}
                          aria-label={`Cho sửa - ${f.name}`}
                        >
                          {val === "editable" && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Function tree row ---------- */

function TreeRow(props: {
  node: FunctionNode;
  depth: number;
  expanded: Record<string, boolean>;
  onToggle: (c: string) => void;
  perms: PermState;
  setPerm: (c: string, a: Action, v: boolean) => void;
  setBranchPerm: (n: FunctionNode, a: Action, v: boolean) => void;
  branchState: (n: FunctionNode, a: Action) => "all" | "some" | "none";
  rowState: (n: FunctionNode) => "all" | "some" | "none";
  setRowPerm: (n: FunctionNode, v: boolean) => void;
  matchesSearch: (n: FunctionNode) => boolean;
}) {
  const {
    node,
    depth,
    expanded,
    onToggle,
    perms,
    setPerm,
    setBranchPerm,
    branchState,
    rowState,
    setRowPerm,
    matchesSearch,
  } = props;
  const hasChildren = !!node.children?.length;
  const isOpen = expanded[node.code] ?? true;
  const isGroup = hasChildren;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-3 px-5 py-2.5 transition-colors",
          isGroup && depth === 0 && "bg-amber-50/60 hover:bg-amber-50",
          isGroup && depth > 0 && "bg-muted/30 hover:bg-muted/50",
          !isGroup && "hover:bg-accent/40",
        )}
        style={{ paddingLeft: 20 + depth * 24 }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.code)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded text-muted-foreground",
            hasChildren ? "hover:bg-background" : "opacity-0",
          )}
          aria-label={isOpen ? "Thu gọn" : "Mở rộng"}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </button>

        {/* Icon */}
        {depth === 0 ? (
          <Boxes className="h-4 w-4 shrink-0 text-amber-600" />
        ) : depth === 1 ? (
          <Folder className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-sky-600" />
        )}

        {/* Name + code */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate",
                isGroup ? "font-semibold text-foreground" : "text-foreground/90",
                depth === 0 && "text-[15px]",
              )}
            >
              {node.name}
            </span>
            <Badge
              variant="outline"
              className="h-5 px-1.5 font-mono text-[10px] text-muted-foreground"
            >
              {node.code}
            </Badge>
          </div>
          {node.description && depth === 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">{node.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pr-4">
          {(() => {
            const rst = rowState(node);
            return (
              <div className="flex w-14 items-center justify-center border-r-2 border-r-foreground/25 pr-3">
                <button
                  type="button"
                  onClick={() => setRowPerm(node, rst !== "all")}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    rst === "all"
                      ? "border-primary bg-primary text-primary-foreground"
                      : rst === "some"
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-input bg-background hover:border-primary/60",
                  )}
                  title={`Chọn tất cả quyền cho ${node.name}`}
                  aria-label={`Chọn tất cả quyền cho ${node.name}`}
                >
                  {rst === "all" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : rst === "some" ? (
                    <Minus className="h-3.5 w-3.5" />
                  ) : null}
                </button>
              </div>
            );
          })()}
          {ACTIONS.map((a) => {
            if (isGroup) {
              const st = branchState(node, a);
              return (
                <div key={a} className="flex w-14 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setBranchPerm(node, a, st !== "all")}
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                      st === "all"
                        ? "border-primary bg-primary text-primary-foreground"
                        : st === "some"
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-input bg-background hover:border-primary/60",
                    )}
                    aria-label={`${ACTION_LABEL[a]} - ${node.name}`}
                    title={`Áp dụng ${ACTION_LABEL[a]} cho toàn bộ nhóm`}
                  >
                    {st === "all" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : st === "some" ? (
                      <Minus className="h-3.5 w-3.5" />
                    ) : null}
                  </button>
                </div>
              );
            }
            return (
              <div key={a} className="flex w-14 items-center justify-center">
                <Checkbox
                  checked={perms[node.code]?.[a] ?? false}
                  onCheckedChange={(v) => setPerm(node.code, a, !!v)}
                  aria-label={`${ACTION_LABEL[a]} - ${node.name}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {hasChildren && isOpen && (
        <ul className="border-l-2 border-dashed border-border/70 ml-[38px]">
          {node.children!.filter(matchesSearch).map((child) => (
            <TreeRow key={child.code} {...props} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
