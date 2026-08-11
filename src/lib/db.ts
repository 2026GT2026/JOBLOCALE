import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "joblocale.db");

declare global {
  // eslint-disable-next-line no-var
  var __joblocaleDb: DatabaseSync | undefined;
}

function createSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('seeker','employer','admin')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seeker_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      headline TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '',
      experience TEXT NOT NULL DEFAULT '',
      education TEXT NOT NULL DEFAULT '',
      portfolio_url TEXT NOT NULL DEFAULT '',
      linkedin_url TEXT NOT NULL DEFAULT '',
      resume_filename TEXT NOT NULL DEFAULT '',
      resume_path TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employer_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL DEFAULT '',
      logo_path TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      industry TEXT NOT NULL DEFAULT '',
      company_size TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      verified INTEGER NOT NULL DEFAULT 0,
      notify_new_applicant INTEGER NOT NULL DEFAULT 1,
      notify_job_status INTEGER NOT NULL DEFAULT 1,
      default_location TEXT NOT NULL DEFAULT '',
      default_employment_type TEXT NOT NULL DEFAULT '',
      default_remote_type TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      employment_type TEXT NOT NULL DEFAULT 'Full-Time',
      remote_type TEXT NOT NULL DEFAULT 'Onsite',
      salary_min INTEGER,
      salary_max INTEGER,
      industry TEXT NOT NULL DEFAULT '',
      experience_level TEXT NOT NULL DEFAULT 'Mid',
      description TEXT NOT NULL DEFAULT '',
      qualifications TEXT NOT NULL DEFAULT '',
      skills TEXT NOT NULL DEFAULT '',
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','published','rejected','expired','closed')),
      rejection_reason TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      published_at TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      cover_letter TEXT NOT NULL DEFAULT '',
      resume_filename TEXT NOT NULL DEFAULT '',
      resume_path TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed','shortlisted','interview','rejected','hired')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(job_id, seeker_id)
    );

    CREATE TABLE IF NOT EXISTS saved_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(seeker_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS job_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seeker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      keyword TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      employment_type TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('job_posting','featured','subscription')),
      description TEXT NOT NULL DEFAULT '',
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending','paid','failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      sender_role TEXT NOT NULL CHECK (sender_role IN ('employer','seeker','admin')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      link TEXT NOT NULL DEFAULT '',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
    CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_applications_seeker ON applications(seeker_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
  `);
}

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function seed(db: DatabaseSync) {
  // BEGIN IMMEDIATE acquires the write lock up front, so concurrent processes
  // (e.g. Next.js build workers) serialize here instead of racing the count
  // check and double-inserting the same seed rows.
  db.exec("BEGIN IMMEDIATE");
  try {
    seedInner(db);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function seedInner(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (row.c > 0) return;

  const insertUser = db.prepare("INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)");
  const passwordHash = bcrypt.hashSync("password123", 10);

  db.prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'admin')").run(
    "admin@joblocale.test",
    passwordHash
  );

  const employerSeed = [
    {
      email: "employer@brightpath.test",
      company_name: "Shopify",
      description:
        "Shopify is a leading commerce platform, helping merchants across the region start, run, and grow their retail businesses online and in-store.",
      industry: "Retail",
      company_size: "51-200",
      website: "https://www.shopify.com",
      location: "Lagos, Nigeria",
      verified: 1,
      joinedDaysAgo: 60,
      logo: "/logos/shopify.svg",
    },
    {
      email: "hr@rivertech.test",
      company_name: "Google",
      description: "Google builds products and platforms used by billions, with engineering teams working on logistics, fintech, and cloud across West Africa.",
      industry: "Technology",
      company_size: "11-50",
      website: "https://www.google.com",
      location: "Accra, Ghana",
      verified: 0,
      joinedDaysAgo: 12,
      logo: "/logos/google.svg",
    },
    {
      email: "careers@sunnydale.test",
      company_name: "GSK",
      description: "GSK is a global healthcare company delivering vaccines, medicines, and community care across the region.",
      industry: "Healthcare",
      company_size: "201-500",
      website: "https://www.gsk.com",
      location: "Nairobi, Kenya",
      verified: 1,
      joinedDaysAgo: 45,
      logo: "/logos/gsk.svg",
    },
    {
      email: "jobs@harborhotels.test",
      company_name: "Marriott",
      description: "Marriott International operates hotels and hospitality services across coastal and city destinations.",
      industry: "Hospitality",
      company_size: "201-500",
      website: "https://www.marriott.com",
      location: "Mombasa, Kenya",
      verified: 0,
      joinedDaysAgo: 4,
      logo: "/logos/marriott.svg",
    },
    {
      email: "hiring@primecapital.test",
      company_name: "Mastercard",
      description: "Mastercard is a global technology company in the payments industry, connecting consumers, businesses, and lenders across markets.",
      industry: "Finance",
      company_size: "11-50",
      website: "https://www.mastercard.com",
      location: "Lagos, Nigeria",
      verified: 1,
      joinedDaysAgo: 30,
      logo: "/logos/mastercard.svg",
    },
  ];

  const employerIds: number[] = [];
  const insertEmployerProfile = db.prepare(
    `INSERT INTO employer_profiles (user_id, company_name, description, industry, company_size, website, location, verified, logo_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const e of employerSeed) {
    const id = Number(
      insertUser.run(e.email, passwordHash, "employer", daysAgoIso(e.joinedDaysAgo)).lastInsertRowid
    );
    insertEmployerProfile.run(
      id,
      e.company_name,
      e.description,
      e.industry,
      e.company_size,
      e.website,
      e.location,
      e.verified,
      e.logo
    );
    employerIds.push(id);
  }
  const [brightpath, rivertech, sunnydale, harbor, primecapital] = employerIds;

  const seekerSeed = [
    {
      email: "jane.doe@example.test",
      full_name: "Jane Doe",
      phone: "+234 800 000 0001",
      location: "Lagos, Nigeria",
      headline: "E-commerce & Digital Marketing Specialist",
      skills: "E-commerce, Digital Marketing, SEO, Shopify, Google Ads",
      experience: "3 years as Digital Marketing Executive at Lagos Mall Group",
      education: "B.Sc. Marketing, University of Lagos",
      joinedDaysAgo: 40,
      hasResume: true,
    },
    {
      email: "sam.osei@example.test",
      full_name: "Sam Osei",
      phone: "+233 800 000 0002",
      location: "Accra, Ghana",
      headline: "Frontend Engineer",
      skills: "React, TypeScript, Node.js, REST APIs",
      experience: "2 years as Frontend Developer at Accra Digital Labs",
      education: "B.Sc. Computer Science, KNUST",
      joinedDaysAgo: 25,
      hasResume: true,
    },
    {
      email: "amina.yusuf@example.test",
      full_name: "Amina Yusuf",
      phone: "+254 700 000 003",
      location: "Nairobi, Kenya",
      headline: "Registered Nurse",
      skills: "Patient Care, Clinical Documentation, First Aid, Phlebotomy",
      experience: "4 years as a Registered Nurse at Nairobi General Hospital",
      education: "B.Sc. Nursing, University of Nairobi",
      joinedDaysAgo: 20,
      hasResume: true,
    },
    {
      email: "david.mwangi@example.test",
      full_name: "David Mwangi",
      phone: "+254 700 000 004",
      location: "Mombasa, Kenya",
      headline: "Hotel Front Desk & Guest Services",
      skills: "Guest Relations, Booking Systems, Concierge, Customer Service",
      experience: "5 years in hospitality front-of-house roles",
      education: "Diploma in Hospitality Management, Coast Institute",
      joinedDaysAgo: 8,
      hasResume: false,
    },
    {
      email: "grace.adeyemi@example.test",
      full_name: "Grace Adeyemi",
      phone: "+234 800 000 005",
      location: "Lagos, Nigeria",
      headline: "Financial Analyst",
      skills: "Financial Modeling, Excel, Risk Analysis, Bookkeeping",
      experience: "3 years as a Financial Analyst at a regional microfinance bank",
      education: "B.Sc. Accounting, University of Lagos",
      joinedDaysAgo: 15,
      hasResume: true,
    },
    {
      email: "kwame.asante@example.test",
      full_name: "Kwame Asante",
      phone: "+233 800 000 006",
      location: "Accra, Ghana",
      headline: "Recent Graduate — Customer Support",
      skills: "Communication, Zendesk, Problem Solving, Data Entry",
      experience: "6-month internship in customer support at a telecom startup",
      education: "B.A. Communications, University of Ghana",
      joinedDaysAgo: 3,
      hasResume: false,
    },
  ];

  const seekerIds: number[] = [];
  const insertSeekerProfile = db.prepare(
    `INSERT INTO seeker_profiles (user_id, full_name, phone, location, headline, skills, experience, education, resume_filename, resume_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const s of seekerSeed) {
    const id = Number(
      insertUser.run(s.email, passwordHash, "seeker", daysAgoIso(s.joinedDaysAgo)).lastInsertRowid
    );
    insertSeekerProfile.run(
      id,
      s.full_name,
      s.phone,
      s.location,
      s.headline,
      s.skills,
      s.experience,
      s.education,
      s.hasResume ? `${s.full_name.replace(/\s+/g, "_")}_Resume.pdf` : "",
      s.hasResume ? "" : ""
    );
    seekerIds.push(id);
  }
  const [jane, sam, amina, david, grace, kwame] = seekerIds;

  type JobSeed = {
    employer_id: number;
    title: string;
    location: string;
    employment_type: string;
    remote_type: string;
    salary_min: number | null;
    salary_max: number | null;
    industry: string;
    experience_level: string;
    description: string;
    qualifications: string;
    skills: string;
    deadline: string | null;
    status: "draft" | "pending" | "published" | "rejected" | "expired" | "closed";
    featured: number;
    postedDaysAgo: number | null;
  };

  const jobSeed: JobSeed[] = [
    {
      employer_id: brightpath,
      title: "E-commerce Manager",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Hybrid",
      salary_min: 1200000,
      salary_max: 1800000,
      industry: "Retail",
      experience_level: "Mid",
      description:
        "Manage online sales channels and digital marketing campaigns for our growing retail brand.",
      qualifications: "3+ years managing e-commerce platforms\nExperience with Shopify or similar\nStrong analytical skills",
      skills: "E-commerce, SEO, Google Ads, Shopify",
      deadline: "2026-09-15",
      status: "published",
      featured: 1,
      postedDaysAgo: 6,
    },
    {
      employer_id: brightpath,
      title: "Store Supervisor",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 350000,
      salary_max: 450000,
      industry: "Retail",
      experience_level: "Entry",
      description: "Oversee daily store operations, staff scheduling, and customer service standards.",
      qualifications: "1+ years retail supervisory experience\nAvailable for weekend shifts",
      skills: "Leadership, Inventory Management, Customer Service",
      deadline: "2026-08-20",
      status: "published",
      featured: 0,
      postedDaysAgo: 2,
    },
    {
      employer_id: brightpath,
      title: "Warehouse Assistant",
      location: "Lagos, Nigeria",
      employment_type: "Contract",
      remote_type: "Onsite",
      salary_min: 200000,
      salary_max: 260000,
      industry: "Retail",
      experience_level: "Entry",
      description: "Support inbound and outbound warehouse logistics for our regional distribution center.",
      qualifications: "Physically able to lift up to 25kg\nBasic literacy and numeracy",
      skills: "Inventory, Forklift, Logistics",
      deadline: "2026-07-01",
      status: "expired",
      featured: 0,
      postedDaysAgo: 40,
    },
    {
      employer_id: rivertech,
      title: "Frontend Engineer (React)",
      location: "Accra, Ghana",
      employment_type: "Full-Time",
      remote_type: "Remote",
      salary_min: 900000,
      salary_max: 1400000,
      industry: "Technology",
      experience_level: "Mid",
      description: "Build and maintain customer-facing dashboards using React and TypeScript.",
      qualifications: "2+ years with React\nComfortable with REST APIs and Git workflows",
      skills: "React, TypeScript, JavaScript, REST APIs",
      deadline: "2026-09-30",
      status: "published",
      featured: 0,
      postedDaysAgo: 9,
    },
    {
      employer_id: rivertech,
      title: "Customer Support Associate",
      location: "Accra, Ghana",
      employment_type: "Part-Time",
      remote_type: "Hybrid",
      salary_min: 250000,
      salary_max: 300000,
      industry: "Technology",
      experience_level: "Entry",
      description: "Support customers via chat and email, and triage issues to the engineering team.",
      qualifications: "Excellent written communication\nPrior support experience a plus",
      skills: "Communication, Zendesk, Problem Solving",
      deadline: null,
      status: "pending",
      featured: 0,
      postedDaysAgo: 1,
    },
    {
      employer_id: rivertech,
      title: "Backend Engineer (Node.js)",
      location: "Accra, Ghana",
      employment_type: "Full-Time",
      remote_type: "Remote",
      salary_min: 1000000,
      salary_max: 1600000,
      industry: "Technology",
      experience_level: "Senior",
      description: "Design and scale our logistics API platform used by hundreds of merchants.",
      qualifications: "4+ years backend engineering\nExperience with PostgreSQL and message queues",
      skills: "Node.js, PostgreSQL, Docker, AWS",
      deadline: null,
      status: "draft",
      featured: 0,
      postedDaysAgo: null,
    },
    {
      employer_id: sunnydale,
      title: "Registered Nurse",
      location: "Nairobi, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 600000,
      salary_max: 850000,
      industry: "Healthcare",
      experience_level: "Mid",
      description: "Provide direct patient care and support clinical staff across our outpatient clinics.",
      qualifications: "Valid nursing license\n2+ years clinical experience",
      skills: "Patient Care, Clinical Documentation, First Aid",
      deadline: "2026-08-31",
      status: "published",
      featured: 1,
      postedDaysAgo: 4,
    },
    {
      employer_id: sunnydale,
      title: "Clinic Receptionist",
      location: "Nairobi, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 280000,
      salary_max: 320000,
      industry: "Healthcare",
      experience_level: "Entry",
      description: "Greet patients, manage appointment scheduling, and handle billing inquiries.",
      qualifications: "Strong organizational skills\nExperience with scheduling software a plus",
      skills: "Customer Service, Scheduling, Data Entry",
      deadline: "2026-09-10",
      status: "published",
      featured: 0,
      postedDaysAgo: 11,
    },
    {
      employer_id: sunnydale,
      title: "Lab Technician",
      location: "Nairobi, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 400000,
      salary_max: 500000,
      industry: "Healthcare",
      experience_level: "Mid",
      description: "Run diagnostic tests and maintain laboratory equipment and safety standards.",
      qualifications: "Diploma in Medical Laboratory Sciences\nAttention to detail",
      skills: "Lab Testing, Quality Control, Safety Compliance",
      deadline: "2026-08-05",
      status: "rejected",
      featured: 0,
      postedDaysAgo: 5,
    },
    {
      employer_id: harbor,
      title: "Hotel Front Desk Agent",
      location: "Mombasa, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 300000,
      salary_max: 380000,
      industry: "Hospitality",
      experience_level: "Entry",
      description: "Welcome guests, manage check-in/check-out, and resolve guest concerns promptly.",
      qualifications: "Excellent interpersonal skills\nFlexible with shift schedules",
      skills: "Guest Relations, Booking Systems, Concierge",
      deadline: "2026-08-25",
      status: "published",
      featured: 0,
      postedDaysAgo: 1,
    },
    {
      employer_id: harbor,
      title: "Hotel Housekeeping Supervisor",
      location: "Mombasa, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 320000,
      salary_max: 400000,
      industry: "Hospitality",
      experience_level: "Mid",
      description: "Lead the housekeeping team to maintain our five-star cleanliness standards.",
      qualifications: "2+ years housekeeping supervisory experience",
      skills: "Team Leadership, Quality Inspection, Scheduling",
      deadline: null,
      status: "pending",
      featured: 0,
      postedDaysAgo: 0,
    },
    {
      employer_id: primecapital,
      title: "Financial Analyst",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Hybrid",
      salary_min: 700000,
      salary_max: 1000000,
      industry: "Finance",
      experience_level: "Mid",
      description: "Analyze lending portfolios and prepare reports for the credit risk committee.",
      qualifications: "2+ years in financial analysis\nAdvanced Excel skills",
      skills: "Financial Modeling, Excel, Risk Analysis",
      deadline: "2026-09-20",
      status: "published",
      featured: 0,
      postedDaysAgo: 13,
    },
    {
      employer_id: primecapital,
      title: "Loan Officer",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 450000,
      salary_max: 600000,
      industry: "Finance",
      experience_level: "Entry",
      description: "Evaluate loan applications from small business owners and manage client relationships.",
      qualifications: "Strong communication skills\nComfortable with fieldwork",
      skills: "Credit Analysis, Sales, Customer Service",
      deadline: "2026-08-10",
      status: "published",
      featured: 0,
      postedDaysAgo: 3,
    },
    {
      employer_id: primecapital,
      title: "Compliance Officer",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 550000,
      salary_max: 750000,
      industry: "Finance",
      experience_level: "Senior",
      description: "Oversee regulatory compliance and internal audit processes across our branches.",
      qualifications: "5+ years in financial compliance\nProfessional certification preferred",
      skills: "Regulatory Compliance, Auditing, Risk Management",
      deadline: null,
      status: "closed",
      featured: 0,
      postedDaysAgo: 25,
    },
  ];

  const additionalJobSeed: JobSeed[] = [
    {
      employer_id: brightpath,
      title: "Digital Marketing Specialist",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Hybrid",
      salary_min: 500000,
      salary_max: 700000,
      industry: "Retail",
      experience_level: "Mid",
      description: "Plan and run paid social and search campaigns across our retail store network.",
      qualifications: "2+ years running paid social campaigns\nComfortable with analytics dashboards",
      skills: "Meta Ads, Google Ads, Analytics, Copywriting",
      deadline: "2026-10-01",
      status: "published",
      featured: 0,
      postedDaysAgo: 4,
    },
    {
      employer_id: brightpath,
      title: "Inventory Analyst",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 400000,
      salary_max: 550000,
      industry: "Retail",
      experience_level: "Entry",
      description: "Track stock levels across stores and flag reorder points before shelves go empty.",
      qualifications: "Comfortable in spreadsheets\nAttention to detail",
      skills: "Excel, Inventory Systems, Forecasting",
      deadline: "2026-09-20",
      status: "published",
      featured: 0,
      postedDaysAgo: 9,
    },
    {
      employer_id: brightpath,
      title: "Delivery Driver",
      location: "Lagos, Nigeria",
      employment_type: "Part-Time",
      remote_type: "Onsite",
      salary_min: 150000,
      salary_max: 220000,
      industry: "Logistics",
      experience_level: "Entry",
      description: "Handle last-mile delivery of online orders across Lagos mainland.",
      qualifications: "Valid rider's permit\nOwn motorbike preferred",
      skills: "Route Planning, Customer Service",
      deadline: "2026-09-05",
      status: "published",
      featured: 0,
      postedDaysAgo: 3,
    },
    {
      employer_id: rivertech,
      title: "DevOps Engineer",
      location: "Accra, Ghana",
      employment_type: "Full-Time",
      remote_type: "Remote",
      salary_min: 1100000,
      salary_max: 1600000,
      industry: "Technology",
      experience_level: "Senior",
      description: "Own our CI/CD pipelines and cloud infrastructure across staging and production.",
      qualifications: "4+ years with AWS or GCP\nExperience with Terraform and Docker",
      skills: "AWS, Terraform, Docker, Kubernetes, CI/CD",
      deadline: "2026-10-10",
      status: "published",
      featured: 1,
      postedDaysAgo: 5,
    },
    {
      employer_id: rivertech,
      title: "Product Designer (UI/UX)",
      location: "Accra, Ghana",
      employment_type: "Full-Time",
      remote_type: "Hybrid",
      salary_min: 700000,
      salary_max: 1000000,
      industry: "Technology",
      experience_level: "Mid",
      description: "Design intuitive flows for our logistics and fintech products used across West Africa.",
      qualifications: "Portfolio of shipped product work\nProficient in Figma",
      skills: "Figma, User Research, Prototyping, Design Systems",
      deadline: "2026-09-25",
      status: "published",
      featured: 0,
      postedDaysAgo: 11,
    },
    {
      employer_id: rivertech,
      title: "QA Engineer",
      location: "Accra, Ghana",
      employment_type: "Contract",
      remote_type: "Remote",
      salary_min: 500000,
      salary_max: 750000,
      industry: "Technology",
      experience_level: "Mid",
      description: "Build automated test suites and own release quality across our web and mobile apps.",
      qualifications: "Experience with Playwright or Cypress\nComfortable reading production logs",
      skills: "Playwright, Cypress, Test Automation, CI/CD",
      deadline: "2026-09-18",
      status: "published",
      featured: 0,
      postedDaysAgo: 7,
    },
    {
      employer_id: sunnydale,
      title: "Pharmacy Technician",
      location: "Nairobi, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 350000,
      salary_max: 480000,
      industry: "Healthcare",
      experience_level: "Entry",
      description: "Support our pharmacists with dispensing, inventory, and patient counter service.",
      qualifications: "Pharmacy technician certification\n1+ years in a retail or clinic pharmacy",
      skills: "Dispensing, Inventory, Patient Care",
      deadline: "2026-09-12",
      status: "published",
      featured: 0,
      postedDaysAgo: 6,
    },
    {
      employer_id: sunnydale,
      title: "Clinic Administrator",
      location: "Nairobi, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 450000,
      salary_max: 600000,
      industry: "Healthcare",
      experience_level: "Mid",
      description: "Manage day-to-day clinic operations, scheduling, and vendor relationships across our sites.",
      qualifications: "3+ years in healthcare administration\nStrong organizational skills",
      skills: "Operations, Scheduling, Vendor Management",
      deadline: "2026-10-05",
      status: "published",
      featured: 0,
      postedDaysAgo: 13,
    },
    {
      employer_id: sunnydale,
      title: "Physiotherapist",
      location: "Nairobi, Kenya",
      employment_type: "Part-Time",
      remote_type: "Onsite",
      salary_min: 500000,
      salary_max: 700000,
      industry: "Healthcare",
      experience_level: "Senior",
      description: "Provide outpatient physiotherapy sessions across our community clinic network.",
      qualifications: "Licensed physiotherapist\n3+ years clinical experience",
      skills: "Physiotherapy, Patient Assessment, Rehabilitation",
      deadline: "2026-09-28",
      status: "published",
      featured: 1,
      postedDaysAgo: 8,
    },
    {
      employer_id: harbor,
      title: "Event Coordinator",
      location: "Mombasa, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 350000,
      salary_max: 500000,
      industry: "Hospitality",
      experience_level: "Mid",
      description: "Plan and run weddings, conferences, and private events across our hotel properties.",
      qualifications: "2+ years in event planning\nComfortable working weekends",
      skills: "Event Planning, Vendor Coordination, Client Relations",
      deadline: "2026-09-22",
      status: "published",
      featured: 0,
      postedDaysAgo: 10,
    },
    {
      employer_id: harbor,
      title: "Executive Chef",
      location: "Mombasa, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 600000,
      salary_max: 900000,
      industry: "Hospitality",
      experience_level: "Senior",
      description: "Lead kitchen operations and menu development across our coastal hotel restaurants.",
      qualifications: "5+ years in a lead kitchen role\nCulinary certification preferred",
      skills: "Menu Development, Kitchen Management, Food Safety",
      deadline: "2026-10-08",
      status: "published",
      featured: 0,
      postedDaysAgo: 15,
    },
    {
      employer_id: harbor,
      title: "Guest Relations Officer",
      location: "Mombasa, Kenya",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 280000,
      salary_max: 380000,
      industry: "Hospitality",
      experience_level: "Entry",
      description: "Be the first point of contact for guests, handling check-ins and resolving requests.",
      qualifications: "Excellent communication skills\nPrior hospitality experience a plus",
      skills: "Guest Relations, Communication, Booking Systems",
      deadline: "2026-09-14",
      status: "published",
      featured: 0,
      postedDaysAgo: 5,
    },
    {
      employer_id: primecapital,
      title: "Credit Risk Analyst",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Hybrid",
      salary_min: 650000,
      salary_max: 900000,
      industry: "Finance",
      experience_level: "Mid",
      description: "Assess loan applications and build risk models for our SME lending portfolio.",
      qualifications: "2+ years in credit or risk analysis\nStrong Excel/SQL skills",
      skills: "Credit Analysis, Risk Modeling, SQL, Excel",
      deadline: "2026-09-30",
      status: "published",
      featured: 0,
      postedDaysAgo: 12,
    },
    {
      employer_id: primecapital,
      title: "Customer Success Officer",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 350000,
      salary_max: 480000,
      industry: "Finance",
      experience_level: "Entry",
      description: "Support our SME clients through onboarding, disbursement, and repayment questions.",
      qualifications: "Strong communication skills\nComfortable with client-facing work",
      skills: "Customer Support, CRM, Communication",
      deadline: "2026-09-16",
      status: "published",
      featured: 0,
      postedDaysAgo: 2,
    },
    {
      employer_id: primecapital,
      title: "Internal Auditor",
      location: "Lagos, Nigeria",
      employment_type: "Full-Time",
      remote_type: "Onsite",
      salary_min: 700000,
      salary_max: 950000,
      industry: "Finance",
      experience_level: "Senior",
      description: "Run periodic audits across branches and report findings directly to the CFO.",
      qualifications: "5+ years in internal audit\nProfessional accounting qualification",
      skills: "Auditing, Risk Management, Financial Reporting",
      deadline: "2026-10-12",
      status: "published",
      featured: 0,
      postedDaysAgo: 18,
    },
  ];

  const insertJob = db.prepare(
    `INSERT INTO jobs (employer_id, title, location, employment_type, remote_type, salary_min, salary_max, industry, experience_level, description, qualifications, skills, deadline, status, featured, views, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const jobIds: number[] = [];
  for (const j of [...jobSeed, ...additionalJobSeed]) {
    const createdAt = j.postedDaysAgo !== null ? daysAgoIso(j.postedDaysAgo) : new Date().toISOString();
    const publishedAt = j.status === "published" || j.status === "expired" || j.status === "closed" ? createdAt : null;
    const views = j.status === "published" ? Math.floor(20 + Math.random() * 300) : Math.floor(Math.random() * 15);

    const info = insertJob.run(
      j.employer_id,
      j.title,
      j.location,
      j.employment_type,
      j.remote_type,
      j.salary_min,
      j.salary_max,
      j.industry,
      j.experience_level,
      j.description,
      j.qualifications,
      j.skills,
      j.deadline,
      j.status,
      j.featured,
      views,
      createdAt,
      createdAt,
      publishedAt
    );
    jobIds.push(Number(info.lastInsertRowid));
  }

  const [
    ecommerceMgr,
    storeSupervisor,
    ,
    frontendEng,
    ,
    ,
    nurseJob,
    receptionistJob,
    ,
    frontDeskJob,
    ,
    analystJob,
    loanOfficerJob,
  ] = jobIds;

  const insertPayment = db.prepare(
    `INSERT INTO payments (employer_id, job_id, type, description, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, 'NGN', 'paid', ?)`
  );
  for (const j of jobSeed) {
    if (j.status === "draft") continue;
    const idx = jobSeed.indexOf(j);
    const jobId = jobIds[idx];
    const createdAt = j.postedDaysAgo !== null ? daysAgoIso(j.postedDaysAgo) : new Date().toISOString();
    insertPayment.run(j.employer_id, jobId, "job_posting", `Job posting fee — ${j.title}`, 15000, createdAt);
    if (j.featured) {
      insertPayment.run(j.employer_id, jobId, "featured", `Featured job promotion — ${j.title}`, 10000, createdAt);
    }
  }

  const insertApplication = db.prepare(
    `INSERT INTO applications (job_id, seeker_id, cover_letter, resume_filename, resume_path, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const applications: { jobId: number; seekerId: number; cover: string; status: string; daysAgo: number }[] = [
    {
      jobId: ecommerceMgr,
      seekerId: jane,
      cover: "I've led Shopify migrations and paid ad campaigns that grew online revenue by 40% in my current role. I'd love to bring that experience to BrightPath.",
      status: "shortlisted",
      daysAgo: 5,
    },
    {
      jobId: storeSupervisor,
      seekerId: jane,
      cover: "While my background is e-commerce, I've also supervised pop-up retail teams and would welcome the chance to discuss transferable skills.",
      status: "reviewed",
      daysAgo: 1,
    },
    {
      jobId: frontendEng,
      seekerId: sam,
      cover: "I've shipped several production React dashboards and am excited about RiverTech's mission in logistics tech.",
      status: "interview",
      daysAgo: 7,
    },
    {
      jobId: nurseJob,
      seekerId: amina,
      cover: "I've spent four years in outpatient clinical care and am passionate about accessible community healthcare.",
      status: "hired",
      daysAgo: 3,
    },
    {
      jobId: receptionistJob,
      seekerId: amina,
      cover: "",
      status: "submitted",
      daysAgo: 0,
    },
    {
      jobId: frontDeskJob,
      seekerId: david,
      cover: "Five years of front-of-house hospitality experience, always focused on guest satisfaction scores.",
      status: "submitted",
      daysAgo: 0,
    },
    {
      jobId: analystJob,
      seekerId: grace,
      cover: "My background in financial modeling and risk analysis for microfinance clients aligns closely with this role.",
      status: "reviewed",
      daysAgo: 2,
    },
    {
      jobId: loanOfficerJob,
      seekerId: grace,
      cover: "I'm interested in moving into a client-facing lending role after three years in analysis.",
      status: "rejected",
      daysAgo: 6,
    },
  ];

  for (const a of applications) {
    const createdAt = daysAgoIso(a.daysAgo);
    insertApplication.run(
      a.jobId,
      a.seekerId,
      a.cover,
      a.cover ? "Resume.pdf" : "",
      a.cover ? "" : "",
      a.status,
      createdAt,
      createdAt
    );
  }

  const shortlistedApp = db
    .prepare("SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?")
    .get(ecommerceMgr, jane) as { id: number } | undefined;
  const interviewApp = db
    .prepare("SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?")
    .get(frontendEng, sam) as { id: number } | undefined;

  const insertMessage = db.prepare(
    "INSERT INTO messages (application_id, sender_role, body, created_at) VALUES (?, ?, ?, ?)"
  );
  if (shortlistedApp) {
    insertMessage.run(
      shortlistedApp.id,
      "employer",
      "Hi Jane, thanks for applying! We'd love to schedule a quick call this week — are you available Thursday afternoon?",
      daysAgoIso(2)
    );
  }
  if (interviewApp) {
    insertMessage.run(
      interviewApp.id,
      "employer",
      "Hi Sam, great news — we'd like to move you to the interview stage. Our recruiter will reach out to schedule.",
      daysAgoIso(3)
    );
  }

  db.prepare("INSERT INTO saved_jobs (seeker_id, job_id, created_at) VALUES (?, ?, ?)").run(
    jane,
    frontendEng,
    daysAgoIso(4)
  );
  db.prepare("INSERT INTO saved_jobs (seeker_id, job_id, created_at) VALUES (?, ?, ?)").run(
    sam,
    ecommerceMgr,
    daysAgoIso(2)
  );
  db.prepare("INSERT INTO saved_jobs (seeker_id, job_id, created_at) VALUES (?, ?, ?)").run(
    kwame,
    frontendEng,
    daysAgoIso(1)
  );

  db.prepare("INSERT INTO job_alerts (seeker_id, keyword, location, employment_type, created_at) VALUES (?, ?, ?, ?, ?)").run(
    jane,
    "Marketing",
    "Lagos",
    "Full-Time",
    daysAgoIso(10)
  );
  db.prepare("INSERT INTO job_alerts (seeker_id, keyword, location, employment_type, created_at) VALUES (?, ?, ?, ?, ?)").run(
    sam,
    "React",
    "",
    "",
    daysAgoIso(6)
  );
  db.prepare("INSERT INTO job_alerts (seeker_id, keyword, location, employment_type, created_at) VALUES (?, ?, ?, ?, ?)").run(
    kwame,
    "Customer Support",
    "Accra",
    "",
    daysAgoIso(2)
  );
}

// node:sqlite returns rows as null-prototype objects. Next.js refuses to
// serialize those across the Server -> Client Component boundary ("Only
// plain objects... can be passed"), so every row is normalized to a plain
// object here, once, instead of at each call site.
function toPlainObject<T>(row: T): T {
  if (row === null || typeof row !== "object") return row;
  return { ...(row as object) } as T;
}

function patchPrepareForPlainObjects(db: DatabaseSync) {
  const originalPrepare = db.prepare.bind(db);
  db.prepare = ((sql: string) => {
    const stmt = originalPrepare(sql);
    const originalGet = stmt.get.bind(stmt);
    const originalAll = stmt.all.bind(stmt);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stmt.get = ((...args: any[]) => toPlainObject(originalGet(...args))) as typeof stmt.get;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stmt.all = ((...args: any[]) => (originalAll(...args) as unknown[]).map(toPlainObject)) as typeof stmt.all;
    return stmt;
  }) as typeof db.prepare;
}

function migrate(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(employer_profiles)").all() as { name: string }[];
  const names = new Set(columns.map((c) => c.name));
  const additions: [string, string][] = [
    ["notify_new_applicant", "INTEGER NOT NULL DEFAULT 1"],
    ["notify_job_status", "INTEGER NOT NULL DEFAULT 1"],
    ["default_location", "TEXT NOT NULL DEFAULT ''"],
    ["default_employment_type", "TEXT NOT NULL DEFAULT ''"],
    ["default_remote_type", "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [name, def] of additions) {
    if (!names.has(name)) {
      db.exec(`ALTER TABLE employer_profiles ADD COLUMN ${name} ${def}`);
    }
  }

  // SQLite CHECK constraints can't be altered with ALTER TABLE, so a messages
  // table created before 'admin' was added as a valid sender_role needs to be
  // rebuilt to allow admin (JobLocale Support) messages on the tracking module.
  const messagesSchema = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'messages'")
    .get() as { sql: string } | undefined;
  if (messagesSchema && !messagesSchema.sql.includes("'admin'")) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(`
        ALTER TABLE messages RENAME TO messages_old;
        CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
          sender_role TEXT NOT NULL CHECK (sender_role IN ('employer','seeker','admin')),
          body TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO messages (id, application_id, sender_role, body, created_at)
          SELECT id, application_id, sender_role, body, created_at FROM messages_old;
        DROP TABLE messages_old;
      `);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
}

function getDb(): DatabaseSync {
  if (globalThis.__joblocaleDb) return globalThis.__joblocaleDb;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, "uploads"), { recursive: true });

  const db = new DatabaseSync(DB_PATH);
  patchPrepareForPlainObjects(db);
  createSchema(db);
  migrate(db);
  seed(db);

  globalThis.__joblocaleDb = db;
  return db;
}

export const db = getDb();
