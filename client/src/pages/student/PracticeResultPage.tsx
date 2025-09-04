import { useLocation, useNavigate } from "react-router-dom";
import PracticeResult from "@/components/practice/PracticeResults";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const PracticeResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get interview object from navigation state
  const interview = location.state?.interview;

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h2 className="text-xl font-semibold mb-4">No interview data found</h2>
        <Button onClick={() => navigate("/student/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-white dark:bg-[#101322]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Render your component with interview as prop */}
          <PracticeResult interview={interview} />
        </div>
      </div>
    </>
  );
};

export default PracticeResultPage;
