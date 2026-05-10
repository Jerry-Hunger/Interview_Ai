import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createJob as createJobApi } from "@/services/api";

type Round = {
  roundNumber: number;
  type: string;
  difficulty: string;
  topic: string;
  notes: string;
};

const CompanyJobForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);

  const addRound = () => {
    if (rounds.length >= 3) {
      toast({ title: "最多只能添加3轮面试", variant: "destructive" });
      return;
    }
    setRounds([
      ...rounds,
      {
        roundNumber: rounds.length + 1,
        type: "technical",
        difficulty: "intermediate",
        topic: "",
        notes: "",
      },
    ]);
  };

  const updateRound = (index: number, field: keyof Round, value: string | number) => {
    const newRounds = [...rounds];
    newRounds[index] = { ...newRounds[index], [field]: value };
    setRounds(newRounds);
  };

  const removeRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "请填写职位名称", variant: "destructive" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "请填写职位描述", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await createJobApi({ title, description, skills, rounds });
      toast({ title: "职位发布成功" });
      navigate("/company/jobs");
    } catch {
      toast({ title: "创建职位失败，请重试", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto py-10 px-6">
        <Card className="shadow-xl bg-white dark:bg-[#181c2f] text-gray-900 dark:text-gray-100 transition-colors">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              创建职位
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                职位名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                className="bg-gray-50 dark:bg-[#101322] border-gray-300 dark:border-gray-700"
                placeholder="例如：前端开发工程师"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                职位描述 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                className="bg-gray-50 dark:bg-[#101322] border-gray-300 dark:border-gray-700"
                placeholder="描述职位职责、要求等"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">
                技能要求（用逗号分隔）
              </Label>
              <Input
                className="bg-gray-50 dark:bg-[#101322] border-gray-300 dark:border-gray-700"
                placeholder="例如：React, TypeScript, Node.js"
                value={skills.join(", ")}
                onChange={(e) =>
                  setSkills(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label className="text-gray-700 dark:text-gray-300">
                  面试环节
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRound}
                  disabled={rounds.length >= 3}
                  className="dark:border-gray-700 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="mr-2" size={16} /> 添加环节
                </Button>
              </div>

              {rounds.map((round, index) => (
                <Card
                  key={index}
                  className="mb-4 p-4 border rounded-lg shadow-sm bg-gray-50 dark:bg-[#101322] border-gray-200 dark:border-gray-700 transition"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                      第 {round.roundNumber} 轮
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRound(index)}
                      aria-label={`删除第 ${round.roundNumber} 轮`}
                      className="text-red-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                      <Trash size={18} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <Label className="text-gray-700 dark:text-gray-300 mb-1">
                        环节类型
                      </Label>
                      <Select
                        value={round.type}
                        onValueChange={(v) => updateRound(index, "type", v)}
                      >
                        <SelectTrigger className="bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#23263A]">
                          <SelectItem value="technical" className="text-gray-900 dark:text-gray-100">技术面试</SelectItem>
                          <SelectItem value="behavioral" className="text-gray-900 dark:text-gray-100">行为面试</SelectItem>
                          <SelectItem value="hr" className="text-gray-900 dark:text-gray-100">HR 面试</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-700 dark:text-gray-300 mb-1">
                        难度
                      </Label>
                      <Select
                        value={round.difficulty}
                        onValueChange={(v) => updateRound(index, "difficulty", v)}
                      >
                        <SelectTrigger className="bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#23263A]">
                          <SelectItem value="beginner" className="text-gray-900 dark:text-gray-100">初级（0-2年）</SelectItem>
                          <SelectItem value="intermediate" className="text-gray-900 dark:text-gray-100">中级（2-5年）</SelectItem>
                          <SelectItem value="senior" className="text-gray-900 dark:text-gray-100">高级（5年以上）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-700 dark:text-gray-300 mb-1">
                        主题
                      </Label>
                      <Input
                        className="bg-gray-50 dark:bg-[#0E1117] border-gray-300 dark:border-gray-700"
                        value={round.topic}
                        onChange={(e) =>
                          updateRound(index, "topic", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="text-gray-700 dark:text-gray-300 mb-1">
                      备注
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

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "发布中..." : "发布职位"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CompanyJobForm;
