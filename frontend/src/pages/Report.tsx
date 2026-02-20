import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  CircularProgress,
  Button,
  Divider,
  Select,
  MenuItem,
  TextField,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../api/auth";
import toast from "react-hot-toast";
import dayjs, { Dayjs } from "dayjs";

/* =================== CHARTS =================== */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/* =================== TYPES =================== */
interface Summary {
  total_nominations?: number;
  coordinator_approved?: number;
  committee_finalists?: number;
  final_winner?: number;
  total_rejections?: number;
  Employees_Yet_to_Nominate?: number;

}

interface DepartmentStat {
  department: string;
  count: number;
}

interface DailyTrend {
  date: string;
  count: number;
}

/* =================== BRAND =================== */
const BRAND = {
  primary: "#0F4C81",
  teal: "#00A8A8",
  tealLight: "#33BDBD",
  grid: "#E5E7EB",
};

const CHART_COLORS = [
  "#006D6D",
  "#008080",
  "#009999",
  "#00B3B3",
  "#33CCCC",
  "#66E0E0",
  "#99F2F2",
];

/* =================== COMPONENT =================== */
const Report: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({});
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [department, setDepartment] = useState("ALL");
  const [fromDate, setFromDate] = useState<Dayjs>(dayjs().subtract(7, "day"));
  const [toDate, setToDate] = useState<Dayjs>(dayjs());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await authAPI.getAdminAnalytics();
      setSummary(res.data.summary || {});
      setDeptStats(res.data.department_stats || []);
      setDailyTrend(res.data.daily_trend || []);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  /* =================== EXPORT =================== */
  const handleExport = async () => {
    try {
      const res = await authAPI.getAdminReport({
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "admin_report.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel report downloaded");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const filteredDeptStats = useMemo(() => {
    if (department === "ALL") return deptStats;
    return deptStats.filter((d) => d.department === department);
  }, [department, deptStats]);

  const filteredDailyTrend = useMemo(() => {
    return dailyTrend.filter((d) => {
      const date = dayjs(d.date);
      return (
        date.isSame(fromDate, "day") ||
        date.isSame(toDate, "day") ||
        (date.isAfter(fromDate) && date.isBefore(toDate))
      );
    });
  }, [dailyTrend, fromDate, toDate]);

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <CircularProgress sx={{ color: BRAND.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}
        <div className="relative mb-10 flex items-center">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/dashboard")}
            sx={{ color: "text.secondary", textTransform: "none", fontWeight: 500 }}
          >
            Back to Dashboard
          </Button>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            Reports & Analytics
          </Typography>

          <Button
            variant="contained"
            onClick={handleExport}
            sx={{
              position: "absolute",
              right: 0,
              bgcolor: BRAND.teal,
              fontWeight: "bold",
              textTransform: "none",
              "&:hover": { bgcolor: "#008f8f" },
            }}
          >
            Export Report
          </Button>
        </div>


        {/* ================= KPIs ================= */}
        <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          <KpiCard label="Total Nominations" value={summary.total_nominations} />
          <KpiCard label="Coordinator Approved" value={summary.coordinator_approved} />
          <KpiCard label="Committee Finalists" value={summary.committee_finalists} />
          <KpiCard label="Final Winners" value={summary.final_winner} />
          <KpiCard label="Total Rejections" value={summary.total_rejections} />
          <KpiCard label="Employees Not Nominated" value={summary.employees_not_nominated} />
        </Box>

        {/* ================= DEPARTMENT ANALYTICS ================= */}
        <Section title="Department-wise Analytics">
          <Select size="small" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <MenuItem value="ALL">All Departments</MenuItem>
            {deptStats.map((d, i) => (
              <MenuItem key={i} value={d.department}>{d.department}</MenuItem>
            ))}
          </Select>

          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <HoverCard title="Nominations by Department">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={filteredDeptStats}>
                  <CartesianGrid stroke={BRAND.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="count" fill={BRAND.tealLight} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </HoverCard>

            <HoverCard title="Department Share">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={filteredDeptStats} dataKey="count" nameKey="department" outerRadius={120}>
                    {filteredDeptStats.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </HoverCard>
          </div>
        </Section>

        {/* ================= DAILY TREND ================= */}
        <Section title="Nomination Trends">
          <Box className="flex gap-4 mt-4 mb-4">
            <TextField
              type="date"
              value={fromDate.format("YYYY-MM-DD")}
              onChange={(e) => setFromDate(dayjs(e.target.value))}
            />
            <TextField
              type="date"
              value={toDate.format("YYYY-MM-DD")}
              onChange={(e) => setToDate(dayjs(e.target.value))}
            />
          </Box>

          <ResponsiveContainer width="100%" height={360}>
            <AreaChart data={filteredDailyTrend}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BRAND.teal} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={BRAND.teal} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={BRAND.grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke={BRAND.teal}
                fill="url(#trendFill)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Section>
      </div>
    </div>
  );
};

/* ================= UI HELPERS ================= */
const KpiCard = ({ label, value }: { label: string; value?: number }) => (
  <Card>
    <CardContent className="text-center">
      <Typography variant="h4" fontWeight={800} sx={{ color: BRAND.primary }}>
        {value ?? 0}
      </Typography>
      <Typography fontWeight={600}>{label}</Typography>
    </CardContent>
  </Card>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box className="bg-white border rounded-xl p-6 mb-10">
    <Typography variant="h6" fontWeight={700}>{title}</Typography>
    <Divider sx={{ my: 2 }} />
    {children}
  </Box>
);

const HoverCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardContent>
      <Typography fontWeight={600} mb={2}>{title}</Typography>
      {children}
    </CardContent>
  </Card>
);

export default Report;
