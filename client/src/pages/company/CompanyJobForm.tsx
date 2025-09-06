import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash } from "lucide-react";
import Navigation from "@/components/Navigation";

const CompanyJobForm = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);

  const addRound = () => {
    setRounds([
      ...rounds,
      {
        roundNumber: rounds.length + 1,
        type: "technical",
        difficulty: "medium",
        topic: "",
        duration: 30,
        notes: "",
      },
    ]);
  };

  const updateRound = (index: number, field: string, value: any) => {
    const newRounds = [...rounds];
    newRounds[index][field] = value;
    setRounds(newRounds);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.post(
        "/jobs",
        { title, description, skills, rounds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/company/jobs");
    } catch (err) {
      console.error("Error creating job:", err);
    }
  };

  return (
    <>
      <Navigation />
      <div className="max-w-4xl mx-auto py-10 px-6">
        <Card className="shadow-xl bg-white dark:bg-[#181A2A] text-gray-900 dark:text-gray-100 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Create Job Opening
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Title */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                Job Title
              </Label>
              <Input
                className="bg-gray-50 dark:bg-[#101322] border-gray-300 dark:border-gray-700"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                Description
              </Label>
              <Textarea
                className="bg-gray-50 dark:bg-[#101322] border-gray-300 dark:border-gray-700"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Skills */}
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                Skills (comma separated)
              </Label>
              <Input
                className="bg-gray-50 dark:bg-[#101322] border-gray-300 dark:border-gray-700"
                value={skills.join(", ")}
                onChange={(e) =>
                  setSkills(e.target.value.split(",").map((s) => s.trim()))
                }
              />
            </div>

            {/* Rounds */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-gray-700 dark:text-gray-300">
                  Interview Rounds
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRound}
                  className="dark:border-gray-700 dark:text-gray-200"
                >
                  <PlusCircle className="mr-2" size={16} /> Add Round
                </Button>
              </div>

              {rounds.map((round, index) => (
                <Card
                  key={index}
                  className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-[#101322] border-gray-200 dark:border-gray-700 transition"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      Round {round.roundNumber}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRound(index)}
                      className="text-red-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash size={18} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        Type
                      </Label>
                      <select
                        className="w-full border p-2 rounded bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200"
                        value={round.type}
                        onChange={(e) =>
                          updateRound(index, "type", e.target.value)
                        }
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="hr">HR</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        Difficulty
                      </Label>
                      <select
                        className="w-full border p-2 rounded bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200"
                        value={round.difficulty}
                        onChange={(e) =>
                          updateRound(index, "difficulty", e.target.value)
                        }
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        Topic
                      </Label>
                      <Input
                        className="bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700"
                        value={round.topic}
                        onChange={(e) =>
                          updateRound(index, "topic", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700 dark:text-gray-300">
                        Duration (mins)
                      </Label>
                      <Input
                        type="number"
                        className="bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700"
                        value={round.duration}
                        onChange={(e) =>
                          updateRound(index, "duration", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="text-gray-700 dark:text-gray-300">
                      Notes
                    </Label>
                    <Textarea
                      className="bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700"
                      value={round.notes}
                      onChange={(e) =>
                        updateRound(index, "notes", e.target.value)
                      }
                    />
                  </div>
                </Card>
              ))}
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Submit Job
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CompanyJobForm;
