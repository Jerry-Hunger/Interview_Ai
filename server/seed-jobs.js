import mongoose from "mongoose";

const MONGO_URI =
  "mongodb+srv://jerry_hunger152:qrgUdw7IGzDwHFpq@cluster0.5pio0lu.mongodb.net/intellihire?appName=Cluster0";
const COMPANY_ID = "69ff4b8793b6e814b0c9f118";

const jobs = [
  {
    companyId: COMPANY_ID,
    title: "前端开发工程师",
    description:
      "负责公司核心产品的前端开发与维护，使用 React + TypeScript 技术栈，参与产品需求分析与技术方案设计，持续优化用户体验和页面性能。",
    skills: ["React", "TypeScript", "HTML/CSS", "Tailwind CSS", "Git", "RESTful API"],
    rounds: [
      {
        roundNumber: 1,
        type: "technical",
        difficulty: "intermediate",
        topic: "React 基础与前端工程化",
        notes: "考察 React Hooks、组件设计模式、状态管理、性能优化等核心知识",
      },
    ],
    status: "open",
  },
  {
    companyId: COMPANY_ID,
    title: "产品经理",
    description:
      "负责 B 端 SaaS 产品的规划与落地，进行用户调研和竞品分析，撰写 PRD 文档，协调设计、研发、测试团队推动产品迭代，跟踪数据指标优化产品体验。",
    skills: ["产品设计", "用户研究", "数据分析", "Axure/Figma", "项目管理", "SQL"],
    rounds: [
      {
        roundNumber: 1,
        type: "behavioral",
        difficulty: "intermediate",
        topic: "产品思维与协作能力",
        notes: "考察需求分析能力、跨部门沟通协调经验、用户同理心和产品决策逻辑",
      },
      {
        roundNumber: 2,
        type: "hr",
        difficulty: "beginner",
        topic: "职业规划与综合素质",
        notes: "了解候选人职业发展意向、团队适配度、薪资期望及入职时间",
      },
    ],
    status: "open",
  },
  {
    companyId: COMPANY_ID,
    title: "Java 后端开发工程师",
    description:
      "参与微服务架构的后端系统开发，负责核心业务模块的设计与实现，优化数据库查询性能，保障系统高可用与稳定性，参与技术方案评审和代码审查。",
    skills: ["Java", "Spring Boot", "MySQL", "Redis", "Docker", "微服务", "Git"],
    rounds: [
      {
        roundNumber: 1,
        type: "technical",
        difficulty: "intermediate",
        topic: "Java 核心与 Spring 框架",
        notes: "考察 Java 基础、集合框架、并发编程、Spring Boot 原理、数据库设计",
      },
      {
        roundNumber: 2,
        type: "technical",
        difficulty: "senior",
        topic: "系统设计与架构能力",
        notes: "考察微服务架构设计、分布式系统、缓存策略、高并发解决方案",
      },
      {
        roundNumber: 3,
        type: "hr",
        difficulty: "beginner",
        topic: "职业规划与团队适配",
        notes: "了解候选人职业目标、团队协作风格、薪资期望及到岗时间",
      },
    ],
    status: "open",
  },
  {
    companyId: COMPANY_ID,
    title: "数据分析师",
    description:
      "负责业务数据的采集、清洗与分析，搭建数据看板和报表体系，通过数据洞察驱动业务决策，配合产品与运营团队进行 A/B 测试和效果评估。",
    skills: ["Python", "SQL", "Excel", "Tableau/Power BI", "统计学", "数据建模"],
    rounds: [
      {
        roundNumber: 1,
        type: "technical",
        difficulty: "intermediate",
        topic: "数据分析与建模能力",
        notes: "考察 SQL 查询优化、Python 数据处理、统计分析方法、数据可视化能力",
      },
      {
        roundNumber: 2,
        type: "behavioral",
        difficulty: "beginner",
        topic: "业务理解与沟通表达",
        notes: "考察业务场景理解、数据驱动决策案例、与业务团队协作经验",
      },
    ],
    status: "open",
  },
  {
    companyId: COMPANY_ID,
    title: "DevOps 高级工程师",
    description:
      "负责 CI/CD 流水线搭建与优化，管理 Kubernetes 集群和容器化部署，保障生产环境稳定性，制定监控告警策略，推动基础设施即代码实践。",
    skills: [
      "Linux",
      "Docker",
      "Kubernetes",
      "Jenkins/GitLab CI",
      "Terraform",
      "AWS/阿里云",
      "Shell/Python",
    ],
    rounds: [
      {
        roundNumber: 1,
        type: "technical",
        difficulty: "senior",
        topic: "容器化与 CI/CD 实践",
        notes: "考察 Docker 原理、K8s 调度策略、CI/CD 流水线设计、日志与监控体系",
      },
      {
        roundNumber: 2,
        type: "behavioral",
        difficulty: "intermediate",
        topic: "运维思维与故障处理经验",
        notes: "考察故障排查思路、On-call 经验、团队协作方式、技术分享习惯",
      },
      {
        roundNumber: 3,
        type: "hr",
        difficulty: "beginner",
        topic: "综合评估与职业发展",
        notes: "确认管理意向、薪资期望、技术发展方向和入职安排",
      },
    ],
    status: "open",
  },
];

async function seed() {
  console.log("正在连接数据库...");
  await mongoose.connect(MONGO_URI);
  console.log("数据库连接成功");

  const collection = mongoose.connection.collection("jobopenings");

  // 先清理之前错误插入的数据（companyId 为字符串类型的）
  const deleteResult = await collection.deleteMany({
    companyId: COMPANY_ID,
  });
  if (deleteResult.deletedCount > 0) {
    console.log(`已清理 ${deleteResult.deletedCount} 条旧数据`);
  }

  // companyId 必须为 ObjectId 类型，否则 Mongoose 查询匹配不上
  const now = new Date();
  const docs = jobs.map((job) => ({
    ...job,
    companyId: new mongoose.Types.ObjectId(COMPANY_ID),
    createdAt: now,
    updatedAt: now,
  }));

  const result = await collection.insertMany(docs);
  console.log(`成功插入 ${result.insertedCount} 条职位记录`);
  console.log("插入的 ID:", Object.values(result.insertedIds).map(String));

  await mongoose.disconnect();
  console.log("数据库连接已关闭");
}

seed().catch((err) => {
  console.error("插入失败:", err.message);
  process.exit(1);
});
