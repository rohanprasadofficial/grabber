export interface Employee {
  id: string;
  name: string;
  email: string;
  title: string;
  department: string;
  location: string;
  status: 'Active' | 'On Leave' | 'Offboarding';
  startDate: string;
  manager: string;
  level: string;
  costCenter: string;
  phone: string;
  skills: string[];
  goals: { name: string; progress: number }[];
  reviews: { period: string; rating: number; summary: string }[];
  activity: { date: string; event: string }[];
}

export const employees: Employee[] = [
  {
    id: 'EMP-1001',
    name: 'Alex Chen',
    email: 'alex.chen@contoso.com',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Seattle, WA',
    status: 'Active',
    startDate: '2021-03-15',
    manager: 'Dana Park',
    level: 'L63',
    costCenter: 'CC-4200',
    phone: '+1 (206) 555-0142',
    skills: ['React', 'TypeScript', 'GraphQL', 'Node.js', 'Azure'],
    goals: [
      { name: 'Ship v2 design system', progress: 85 },
      { name: 'Mentor 2 junior engineers', progress: 50 },
      { name: 'Reduce bundle size by 20%', progress: 92 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Exceeded expectations on design system delivery. Strong technical leadership across the team.' },
      { period: 'H1 2025', rating: 3, summary: 'Solid execution on core projects. Opportunity to increase cross-team collaboration.' },
    ],
    activity: [
      { date: '2025-12-01', event: 'Promoted to Senior Software Engineer' },
      { date: '2025-09-15', event: 'Completed Azure Fundamentals certification' },
      { date: '2025-06-01', event: 'Transferred from Platform team to Design Systems' },
      { date: '2025-03-15', event: 'Completed 4-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1002',
    name: 'Sara Kim',
    email: 'sara.kim@contoso.com',
    title: 'Product Designer',
    department: 'Design',
    location: 'San Francisco, CA',
    status: 'Active',
    startDate: '2022-07-11',
    manager: 'James Wright',
    level: 'L62',
    costCenter: 'CC-3100',
    phone: '+1 (415) 555-0198',
    skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research', 'CSS'],
    goals: [
      { name: 'Redesign employee portal', progress: 70 },
      { name: 'Create component audit report', progress: 100 },
      { name: 'Run 5 usability studies', progress: 60 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Outstanding design work on the portal redesign. Proactively drove alignment across engineering and PM.' },
      { period: 'H1 2025', rating: 4, summary: 'Consistently high-quality output. Became the go-to person for design system questions.' },
    ],
    activity: [
      { date: '2025-11-10', event: 'Published internal design guidelines v3' },
      { date: '2025-08-20', event: 'Presented at company design summit' },
      { date: '2025-07-11', event: 'Completed 3-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1003',
    name: 'Mike Johnson',
    email: 'mike.johnson@contoso.com',
    title: 'Engineering Manager',
    department: 'Engineering',
    location: 'Redmond, WA',
    status: 'Active',
    startDate: '2019-01-07',
    manager: 'Lisa Huang',
    level: 'L65',
    costCenter: 'CC-4200',
    phone: '+1 (425) 555-0167',
    skills: ['People Management', 'System Design', 'Java', 'Python', 'Agile'],
    goals: [
      { name: 'Grow team to 12 engineers', progress: 75 },
      { name: 'Reduce incident response time by 30%', progress: 88 },
      { name: 'Launch self-service analytics', progress: 40 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 3, summary: 'Team delivery on track. Continue developing coaching skills with senior ICs.' },
    ],
    activity: [
      { date: '2025-10-01', event: 'Hired 2 new senior engineers' },
      { date: '2025-06-15', event: 'Completed management training program' },
      { date: '2025-01-07', event: 'Completed 6-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1004',
    name: 'Priya Rao',
    email: 'priya.rao@contoso.com',
    title: 'Data Scientist',
    department: 'Data & AI',
    location: 'Bangalore, India',
    status: 'Active',
    startDate: '2023-02-20',
    manager: 'Raj Patel',
    level: 'L61',
    costCenter: 'CC-5300',
    phone: '+91 80 5555 0134',
    skills: ['Python', 'TensorFlow', 'SQL', 'Spark', 'Statistics'],
    goals: [
      { name: 'Deploy attrition prediction model', progress: 65 },
      { name: 'Build executive dashboard', progress: 90 },
      { name: 'Complete ML Ops certification', progress: 30 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Impressive ramp-up. The attrition model is already showing promising results with the HR team.' },
    ],
    activity: [
      { date: '2025-11-20', event: 'Presented ML model to HR leadership' },
      { date: '2025-09-01', event: 'Joined Data & AI guild' },
      { date: '2025-02-20', event: 'Completed 2-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1005',
    name: 'Jordan Taylor',
    email: 'jordan.taylor@contoso.com',
    title: 'Program Manager',
    department: 'Product',
    location: 'New York, NY',
    status: 'On Leave',
    startDate: '2020-09-14',
    manager: 'Dana Park',
    level: 'L63',
    costCenter: 'CC-2100',
    phone: '+1 (212) 555-0156',
    skills: ['Roadmapping', 'Stakeholder Mgmt', 'SQL', 'Jira', 'OKRs'],
    goals: [
      { name: 'Launch Q1 feature set', progress: 55 },
      { name: 'Improve spec review turnaround to < 3 days', progress: 80 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 3, summary: 'Good cross-functional coordination. On leave since November — goals paused.' },
      { period: 'H1 2025', rating: 3, summary: 'Steady delivery. Opportunity to take more ownership of roadmap priorities.' },
    ],
    activity: [
      { date: '2025-11-15', event: 'Started parental leave' },
      { date: '2025-09-14', event: 'Completed 5-year work anniversary' },
      { date: '2025-07-01', event: 'Led cross-org planning offsite' },
    ],
  },
  {
    id: 'EMP-1006',
    name: 'Emily Nakamura',
    email: 'emily.nakamura@contoso.com',
    title: 'UX Researcher',
    department: 'Design',
    location: 'San Francisco, CA',
    status: 'Active',
    startDate: '2023-08-28',
    manager: 'James Wright',
    level: 'L60',
    costCenter: 'CC-3100',
    phone: '+1 (415) 555-0211',
    skills: ['User Interviews', 'Survey Design', 'Qualtrics', 'Data Analysis', 'Figma'],
    goals: [
      { name: 'Run quarterly NPS study', progress: 100 },
      { name: 'Build research repository', progress: 45 },
      { name: 'Train 3 PMs on research methods', progress: 67 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Excellent initiative building the research repo. NPS insights directly influenced roadmap.' },
    ],
    activity: [
      { date: '2025-12-05', event: 'Published NPS Q4 report' },
      { date: '2025-10-15', event: 'Hosted research methods workshop' },
      { date: '2025-08-28', event: 'Completed 2-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1007',
    name: 'David Park',
    email: 'david.park@contoso.com',
    title: 'Software Engineer',
    department: 'Engineering',
    location: 'Seattle, WA',
    status: 'Active',
    startDate: '2024-06-03',
    manager: 'Mike Johnson',
    level: 'L60',
    costCenter: 'CC-4200',
    phone: '+1 (206) 555-0189',
    skills: ['React', 'TypeScript', 'Go', 'Docker', 'Kubernetes'],
    goals: [
      { name: 'Own notifications microservice', progress: 70 },
      { name: 'Write 3 tech design docs', progress: 33 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 3, summary: 'Solid ramp-up for first year. Showing good ownership of the notifications service.' },
    ],
    activity: [
      { date: '2025-11-01', event: 'Shipped notifications v1 to production' },
      { date: '2025-08-15', event: 'Completed onboarding buddy program' },
      { date: '2025-06-03', event: 'Joined Contoso' },
    ],
  },
  {
    id: 'EMP-1008',
    name: 'Maria Santos',
    email: 'maria.santos@contoso.com',
    title: 'HR Business Partner',
    department: 'Human Resources',
    location: 'Austin, TX',
    status: 'Active',
    startDate: '2021-11-01',
    manager: 'Rachel Greene',
    level: 'L62',
    costCenter: 'CC-1100',
    phone: '+1 (512) 555-0145',
    skills: ['Employee Relations', 'Compensation', 'Workday', 'Talent Strategy', 'Coaching'],
    goals: [
      { name: 'Reduce time-to-hire to < 30 days', progress: 78 },
      { name: 'Roll out new performance framework', progress: 95 },
      { name: 'Achieve 85% engagement score', progress: 82 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Key driver of the performance framework rollout. Partners effectively with engineering leadership.' },
      { period: 'H1 2025', rating: 3, summary: 'Consistent delivery on HR programs. Building strong relationships across business units.' },
    ],
    activity: [
      { date: '2025-12-10', event: 'Launched new performance review cycle' },
      { date: '2025-09-01', event: 'Completed SHRM-SCP certification' },
      { date: '2025-11-01', event: 'Completed 4-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1009',
    name: 'Kevin Liu',
    email: 'kevin.liu@contoso.com',
    title: 'Security Engineer',
    department: 'Engineering',
    location: 'Redmond, WA',
    status: 'Active',
    startDate: '2022-04-18',
    manager: 'Mike Johnson',
    level: 'L62',
    costCenter: 'CC-4200',
    phone: '+1 (425) 555-0177',
    skills: ['Threat Modeling', 'Penetration Testing', 'Azure Security', 'Python', 'SIEM'],
    goals: [
      { name: 'Complete SOC2 audit prep', progress: 90 },
      { name: 'Run red team exercise', progress: 60 },
      { name: 'Automate vulnerability scanning', progress: 75 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Led SOC2 prep with minimal disruption to engineering. Red team exercise was well-received.' },
    ],
    activity: [
      { date: '2025-12-15', event: 'Completed SOC2 Type II audit' },
      { date: '2025-10-01', event: 'Ran company-wide red team exercise' },
      { date: '2025-04-18', event: 'Completed 3-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1010',
    name: 'Rachel Okonkwo',
    email: 'rachel.okonkwo@contoso.com',
    title: 'Frontend Engineer',
    department: 'Engineering',
    location: 'London, UK',
    status: 'Offboarding',
    startDate: '2022-01-10',
    manager: 'Mike Johnson',
    level: 'L61',
    costCenter: 'CC-4200',
    phone: '+44 20 5555 0163',
    skills: ['React', 'CSS', 'Accessibility', 'Performance', 'Storybook'],
    goals: [
      { name: 'Migrate to new component library', progress: 40 },
      { name: 'Achieve WCAG 2.1 AA compliance', progress: 85 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 3, summary: 'Strong accessibility expertise. Last day January 15 — knowledge transfer in progress.' },
    ],
    activity: [
      { date: '2025-12-20', event: 'Started offboarding process' },
      { date: '2025-11-01', event: 'Submitted resignation' },
      { date: '2025-08-01', event: 'Led accessibility audit for portal' },
    ],
  },
  {
    id: 'EMP-1011',
    name: 'Thomas Weber',
    email: 'thomas.weber@contoso.com',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Berlin, Germany',
    status: 'Active',
    startDate: '2023-05-15',
    manager: 'Mike Johnson',
    level: 'L61',
    costCenter: 'CC-4200',
    phone: '+49 30 5555 0122',
    skills: ['Terraform', 'Kubernetes', 'CI/CD', 'Azure DevOps', 'Monitoring'],
    goals: [
      { name: 'Achieve 99.95% uptime SLA', progress: 97 },
      { name: 'Migrate to GitHub Actions', progress: 55 },
      { name: 'Reduce deploy time to < 10 min', progress: 80 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Exceptional reliability work. SLA consistently exceeded targets. Pipeline migration on track.' },
    ],
    activity: [
      { date: '2025-12-01', event: 'Achieved 99.97% uptime for Q4' },
      { date: '2025-09-15', event: 'Completed Kubernetes CKA certification' },
      { date: '2025-05-15', event: 'Completed 2-year work anniversary' },
    ],
  },
  {
    id: 'EMP-1012',
    name: 'Lisa Huang',
    email: 'lisa.huang@contoso.com',
    title: 'VP of Engineering',
    department: 'Engineering',
    location: 'Redmond, WA',
    status: 'Active',
    startDate: '2018-03-01',
    manager: 'CTO',
    level: 'L68',
    costCenter: 'CC-4000',
    phone: '+1 (425) 555-0101',
    skills: ['Technical Strategy', 'Org Design', 'Executive Communication', 'M&A Integration'],
    goals: [
      { name: 'Scale engineering org to 200 headcount', progress: 62 },
      { name: 'Launch platform v3', progress: 45 },
      { name: 'Reduce annual attrition to < 10%', progress: 88 },
    ],
    reviews: [
      { period: 'H2 2025', rating: 4, summary: 'Strong strategic leadership. Platform v3 planning is ambitious but well-scoped.' },
    ],
    activity: [
      { date: '2025-12-10', event: 'Presented 2026 engineering strategy to board' },
      { date: '2025-10-01', event: 'Kicked off platform v3 initiative' },
      { date: '2025-03-01', event: 'Completed 7-year work anniversary' },
    ],
  },
];

export const departments = ['Engineering', 'Design', 'Product', 'Data & AI', 'Human Resources'] as const;
export const locations = ['Seattle, WA', 'San Francisco, CA', 'Redmond, WA', 'New York, NY', 'Austin, TX', 'Bangalore, India', 'London, UK', 'Berlin, Germany'] as const;
export const statuses = ['Active', 'On Leave', 'Offboarding'] as const;
