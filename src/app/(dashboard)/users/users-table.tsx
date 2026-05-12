"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelIcon from "@mui/icons-material/Cancel";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import {
  setUserApprovedAction,
  setUserRoleAction,
} from "./actions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type SortKey = "full_name" | "email" | "role" | "approved" | "created_at";
type SortDir = "asc" | "desc";

export function UsersTable({ data }: { data: Profile[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterApproved, setFilterApproved] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data]
      .filter((p) => {
        if (filterApproved === "yes" && !p.approved) return false;
        if (filterApproved === "no" && p.approved) return false;
        if (!q) return true;
        return (
          (p.full_name ?? "").toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const av = (a[sortKey] ?? "") as string | boolean | null;
        const bv = (b[sortKey] ?? "") as string | boolean | null;
        if (av === bv) return 0;
        const cmp = av! > bv! ? 1 : -1;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [data, search, sortKey, sortDir, filterApproved]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function updateRole(id: string, role: "admin" | "user") {
    setBusyId(id);
    try {
      const res = await setUserRoleAction(id, role);
      if (res.error) throw new Error(res.error);
      toast.success("Role updated.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update role.");
    } finally {
      setBusyId(null);
    }
  }

  async function setApproved(id: string, approved: boolean) {
    setBusyId(id);
    try {
      const res = await setUserApprovedAction(id, approved);
      if (res.error) throw new Error(res.error);
      if (res.warning) {
        toast.warning(res.warning);
      } else if (approved) {
        toast.success("User approved. Notification email sent.");
      } else {
        toast.success("User access revoked.");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update access.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, maxWidth: 380 }}>
          <Input
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={
              <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            }
          />
        </Box>
        <Box sx={{ width: 180 }}>
          <Select
            value={filterApproved}
            onValueChange={(v) =>
              setFilterApproved(v as typeof filterApproved)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="yes">Approved</SelectItem>
              <SelectItem value="no">Pending</SelectItem>
            </SelectContent>
          </Select>
        </Box>
        <Box sx={{ ml: "auto" }}>
          <Typography variant="body2" color="text.secondary">
            {rows.length} of {data.length}
          </Typography>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ backgroundColor: "rgba(0,0,0,0.03)" }}>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "full_name"}
                    direction={sortKey === "full_name" ? sortDir : "asc"}
                    onClick={() => toggleSort("full_name")}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Photo</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "email"}
                    direction={sortKey === "email" ? sortDir : "asc"}
                    onClick={() => toggleSort("email")}
                  >
                    Email
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "role"}
                    direction={sortKey === "role" ? sortDir : "asc"}
                    onClick={() => toggleSort("role")}
                  >
                    Role
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "approved"}
                    direction={sortKey === "approved" ? sortDir : "asc"}
                    onClick={() => toggleSort("approved")}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortKey === "created_at"}
                    direction={sortKey === "created_at" ? sortDir : "asc"}
                    onClick={() => toggleSort("created_at")}
                  >
                    Joined
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 5, color: "text.secondary" }}
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((u) => (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{ opacity: busyId === u.id ? 0.6 : 1 }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {u.full_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Avatar
                        src={u.photo_url}
                        fallback={initials(u.full_name ?? u.email)}
                        sx={{ width: 36, height: 36 }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 130 }}>
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            updateRole(u.id, v as "admin" | "user")
                          }
                          disabled={busyId === u.id}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="user">user</SelectItem>
                          </SelectContent>
                        </Select>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {u.approved ? (
                        <Badge variant="success">
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 13 }} />
                            Approved
                          </Box>
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Box
                            component="span"
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <CancelIcon sx={{ fontSize: 13 }} />
                            Pending
                          </Box>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      {u.approved ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setApproved(u.id, false)}
                          disabled={busyId === u.id}
                        >
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setApproved(u.id, true)}
                          disabled={busyId === u.id}
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
