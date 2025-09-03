import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, TrendingUp, Target, Play, Building, ArrowLeft } from 'lucide-react';

const PracticeResults = ({
  results,
  getScoreColor,
  navigate
}: any) => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Results</h1>
      <p className="text-gray-500 dark:text-gray-400">Here's how you performed in your practice session</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Overall Score */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-yellow-500 dark:text-yellow-400">
            <Star size={20} />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-5xl font-bold mb-4">
            <span className={getScoreColor(results.overallScore)}>{results.overallScore}</span>
            <span className="text-2xl text-gray-500 dark:text-gray-400">/100</span>
          </div>
          <Progress value={results.overallScore} className="mb-4 bg-yellow-200 dark:bg-yellow-900" />
          <Badge variant={results.overallScore >= 85 ? "success" as any : results.overallScore >= 70 ? "warning" as any : "destructive"}>
            {results.overallScore >= 85 ? 'Excellent' : results.overallScore >= 70 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </CardContent>
      </Card>
      {/* Score Breakdown */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
            <TrendingUp size={20} />
            Skill Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(results.breakdown).map(([skill, score]) => (
            <div key={skill} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">{skill.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
              </div>
              <Progress value={score} className="h-2 bg-indigo-200 dark:bg-indigo-900" />
            </div>
          ))}
        </CardContent>
      </Card>
      {/* Quick Actions */}
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-indigo-500 dark:text-indigo-400">Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-700 dark:to-purple-700 text-white font-semibold hover:shadow-lg">
            <Play size={16} className="mr-2" />
            Practice Again
          </Button>
          <Button variant="outline" className="w-full text-indigo-500 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700" onClick={() => navigate('/student/companies')}>
            <Building size={16} className="mr-2" />
            Explore Companies
          </Button>
          <Button variant="outline" className="w-full text-purple-500 dark:text-purple-400 border border-purple-200 dark:border-purple-700" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
    {/* Detailed Feedback */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-green-500 dark:text-green-400">Strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {results.strengths.map((strength: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="text-green-500 dark:text-green-400 mt-0.5" size={16} />
                <span className="text-sm text-gray-900 dark:text-white">{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card className="shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-yellow-500 dark:text-yellow-400">Areas for Improvement</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {results.improvements.map((improvement: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <Target className="text-yellow-500 dark:text-yellow-400 mt-0.5" size={16} />
                <span className="text-sm text-gray-900 dark:text-white">{improvement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
    {/* Detailed Feedback */}
    <Card className="mt-8 shadow-lg bg-white dark:bg-[#181A2A] border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="text-indigo-500 dark:text-indigo-400">Detailed Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{results.detailedFeedback}</p>
      </CardContent>
    </Card>
  </div>
);

export default PracticeResults;