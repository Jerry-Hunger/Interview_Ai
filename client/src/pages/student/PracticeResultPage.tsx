import { useLocation, useNavigate } from "react-router-dom";
import PracticeResult from "@/components/practice/PracticeResults";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const PracticeResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const interview = location.state?.interview;

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center bg-white dark:bg-[#101322]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">未找到面试记录</h2>
        <Button onClick={() => navigate("/student/dashboard")}>
          返回仪表盘
        </Button>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <PracticeResult interview={interview} navigate={navigate} />
        </div>
      </div>
    </>
  );
};

export default PracticeResultPage;
