import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useEmblaCarousel from "embla-carousel-react";
import {
  Calendar,
  Gauge,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart,
  Play,
} from "lucide-react";

const statusMeta = (raw: string) => {
  const key = (raw || "").toLowerCase();
  if (key === "success" || key === "pass") {
    return {
      label: "Passed",
      badgeClass:
        "border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20",
      ringClass: "hover:ring-green-300/60 dark:hover:ring-green-500/30",
      Icon: CheckCircle,
    };
  }
  if (key === "failure" || key === "fail") {
    return {
      label: "Failed",
      badgeClass: "border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20",
      ringClass: "hover:ring-red-300/60 dark:hover:ring-red-500/30",
      Icon: XCircle,
    };
  }
  // quit / other
  return {
    label: "Quit",
    badgeClass:
      "border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
    ringClass: "hover:ring-yellow-300/60 dark:hover:ring-yellow-500/30",
    Icon: AlertCircle,
  };
};

type Interview = {
  _id: string;
  result: "success" | "failure" | "Quit";
  difficulty: string;
  type: "practice" | "company";
  createdAt: string;
};

const StudentDashboard = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/interview/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (Array.isArray(res.data)) {
          setInterviews(res.data);
        } else if (Array.isArray(res.data.data)) {
          setInterviews(res.data.data);
        } else {
          setInterviews([]);
        }
      } catch (err) {
        console.error("Error fetching interviews", err);
        setInterviews([]);
      }
    };
    fetchInterviews();
  }, []);

  // 📊 Stats
  const total = interviews.length;
  const passed = interviews.filter((i) => i.result === "success").length;
  const failed = interviews.filter((i) => i.result === "failure").length;
  const quit = interviews.filter((i) => i.result === "Quit").length;

  // 🎯 Group interviews by status
  const groups = {
    Passed: interviews.filter((i) => i.result === "success"),
    Failed: interviews.filter((i) => i.result === "failure"),
    Quit: interviews.filter((i) => i.result === "Quit"),
  };

  // 🎠 Slider Wrapper
  // 🎠 Slider Wrapper with buttons
  const Carousel = ({ children }: { children: React.ReactNode }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
      align: "start",
      dragFree: true,
      containScroll: "trimSnaps",
    });

    return (
      <div className="relative">
        {/* Track */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">{children}</div>
        </div>

        {/* Prev Button */}
        <button
          onClick={() => emblaApi && emblaApi.scrollPrev()}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 
                   p-2 rounded-full bg-white dark:bg-gray-800 shadow-md 
                   hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ‹
        </button>

        {/* Next Button */}
        <button
          onClick={() => emblaApi && emblaApi.scrollNext()}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 
                   p-2 rounded-full bg-white dark:bg-gray-800 shadow-md 
                   hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          ›
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#101322]">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          My Interviews
        </h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Interviews</p>
                <p className="text-2xl font-bold dark:text-white">{total}</p>
              </div>
              <BarChart className="text-indigo-500" size={28} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Passed</p>
                <p className="text-2xl font-bold text-green-500">{passed}</p>
              </div>
              <CheckCircle className="text-green-500" size={28} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Failed</p>
                <p className="text-2xl font-bold text-red-500">{failed}</p>
              </div>
              <XCircle className="text-red-500" size={28} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Quit</p>
                <p className="text-2xl font-bold text-yellow-500">{quit}</p>
              </div>
              <AlertCircle className="text-yellow-500" size={28} />
            </CardContent>
          </Card>
        </div>

        {/* Interview Groups */}
        {Object.entries(groups).map(([status, items]) =>
          items.length > 0 ? (
            <div key={status} className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                {status} Interviews
              </h2>
              <Carousel>
                {items.map((i) => (
                  <Card
                    key={i._id}
                    onClick={() =>
                      navigate("/student/practice-result", {
                        state: { interview: i },
                      })
                    }
                    className={[
                      "min-w-[280px] cursor-pointer rounded-2xl",
                      "bg-white/90 dark:bg-[#181A2A]/80",
                      "border border-gray-100 dark:border-white/5",
                      "shadow-sm hover:shadow-xl transition-all",
                      "hover:scale-[1.02] hover:border-transparent",
                      "relative overflow-hidden",
                    ].join(" ")}
                  >
                    {/* soft gradient wash */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />

                    <CardHeader className="relative z-10">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold dark:text-white">
                          {i.type === "practice" ? "Practice" : "Company"}
                        </CardTitle>

                        {/* Status badge – use outline + custom colors instead of unsupported variants */}
                        {(() => {
                          const meta = statusMeta(i.result);
                          return (
                            <Badge
                              variant="outline"
                              className={`px-2 py-0.5 ${meta.badgeClass}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <meta.Icon size={14} />
                                <span className="text-xs font-medium">
                                  {meta.label}
                                </span>
                              </div>
                            </Badge>
                          );
                        })()}
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Gauge size={16} />
                          <span className="font-medium capitalize">
                            {i.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar size={16} />
                          <span>
                            {new Date(i.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* bottom accent ring on hover, colored by status */}
                      {(() => {
                        const { ringClass } = statusMeta(i.result);
                        return (
                          <div
                            className={[
                              "h-[2px] w-full rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30",
                              "transition-all",
                              ringClass,
                            ].join(" ")}
                          />
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </Carousel>
            </div>
          ) : null
        )}

        {/* Quick Action */}
        <div className="mt-8">
          <Button
            onClick={() => navigate("/student/practice")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl px-6 py-2 shadow-md hover:shadow-lg transition"
          >
            <Play size={16} className="mr-2" />
            Start New Practice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
