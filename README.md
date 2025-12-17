# 🎯 Interview Expert

> An AI-powered interview preparation platform built with Next.js, Express, Prisma, and Google Gemini 2.5 Flash. Get FAANG-grade resume optimization, adaptive mock interviews, and personalized career coaching.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)

---

## ✨ Features

### 📄 Resume Intelligence
- **ATS Score Analysis**: Get instant feedback on how well your resume passes Applicant Tracking Systems
- **AI-Powered Rewriting**: Transform weak bullet points into FAANG-grade impact statements
- **Side-by-Side Optimization**: See original vs. optimized versions with highlighted improvements
- **Structured Parsing**: Extracts work experience, projects, education, and leadership roles
- **Keyword Extraction**: Identifies high-impact keywords and missing skills

### 💼 Job Description Analysis
- **Role Classification**: Automatically detects seniority level and role focus
- **Tech Stack Extraction**: Identifies required technologies and frameworks
- **Gap Analysis**: Compares your resume against job requirements
- **Tailored Recommendations**: Get specific suggestions to align with target roles

### 🎤 Adaptive Mock Interviews
- **Resume-Aware Questions**: AI generates questions based on YOUR specific experience
- **Difficulty Progression**: Questions adapt based on your performance (Easy → Medium → Hard)
- **STAR Framework Coach**: Real-time feedback on behavioral answers (Situation, Task, Action, Result)
- **Deep-Dive Probing**: Follow-up questions that challenge vague or overclaimed achievements
- **Multi-Round Sessions**: Complete 5-question interview loops with comprehensive feedback

### 📊 Performance Dashboard
- **Interview Statistics**: Track average scores, sessions completed, and progress over time
- **Skill Heatmap**: Visual breakdown of strengths and weaknesses
- **AI Insights**: Personalized recommendations based on interview performance
- **Career Goals Tracking**: Set and monitor progress toward target roles and companies

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **Animations**: Framer Motion
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **AI Engine**: Google Gemini 2.5 Flash API
- **Database**: MongoDB Atlas with Prisma ORM
- **File Processing**: PDF parsing, DOCX support
- **API Design**: RESTful with JSON responses

### Infrastructure
- **Database**: MongoDB Atlas (Cloud)
- **File Storage**: In-memory processing (no permanent storage)
- **Development**: Hot reload with ts-node-dev

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free tier works)
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/interview-expert.git
cd interview-expert
```

### 2. Install Dependencies
```bash
# Install root dependencies (if any)
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Configure Environment Variables

**Backend** (`backend/.env`):
```env
DATABASE_URL="your_mongodb_connection_string"
GEMINI_API_KEY="your_gemini_api_key"
```

**Frontend** (`frontend/.env.local`):
```env
GEMINI_API_KEY="your_gemini_api_key"
```

### 4. Set Up Database
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. Run Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# Server runs on http://localhost:4000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

---

## 🎯 Usage

### Resume Optimization
1. Navigate to `/resume`
2. Upload your resume (PDF or DOCX)
3. Get instant ATS score and analysis
4. Click "Optimize Resume" for AI-powered improvements
5. View side-by-side comparison with highlighted changes

### Mock Interviews
1. Navigate to `/interview`
2. Upload your resume
3. Paste the target job description
4. Click "Start Interview"
5. Answer 5 adaptive questions
6. Receive STAR framework feedback
7. Get final readiness report with scores

### Dashboard & Profile
1. Navigate to `/dashboard` for quick stats
2. Go to `/profile` to set career goals
3. Track your interview performance over time
4. View AI-generated insights on strengths/weaknesses

---

## 🏗️ Project Structure

```
interview-expert/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── resume/      # Resume optimizer
│   │   │   ├── interview/   # Mock interview
│   │   │   ├── dashboard/   # User dashboard
│   │   │   └── profile/     # User profile
│   │   └── components/      # Reusable components
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Express API server
│   ├── src/
│   │   └── index.ts         # Main server file
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
└── README.md               # This file
```

---

## 🔑 Key Features Explained

### Phase 2: Enhanced Core Features (Implemented)
- ✅ **Resume Deep-Dive Questions**: AI probes specific metrics from your resume
- ✅ **STAR Framework Coach**: Analyzes behavioral answers for completeness
- ✅ **Difficulty Progression**: Adapts question difficulty based on performance

### Database Models
- **User**: Basic user information
- **Resume**: Parsed resume data with structured fields
- **JobDescription**: Analyzed job postings
- **Match**: Semantic matching between resume and JD
- **InterviewSession**: Complete interview history with exchanges
- **InterviewProfile**: User-specific interview statistics and insights

---

## 🌟 Highlights

### AI-Powered Intelligence
- Uses **Gemini 2.5 Flash** for state-of-the-art natural language understanding
- Structured JSON responses for reliable parsing
- Retry logic with exponential backoff for API resilience
- Context-aware prompts for personalized feedback

### Premium UI/UX
- **Glassmorphism Design**: Modern, translucent card-based interface
- **Smooth Animations**: Framer Motion for delightful interactions
- **Dark Mode Support**: Automatic theme switching
- **Responsive Layout**: Works on desktop, tablet, and mobile

### Production-Ready
- TypeScript for type safety
- Prisma ORM for database migrations
- Error handling and validation
- API rate limiting considerations

---

## 🚧 Roadmap

### Phase 3: Advanced Evaluation (Planned)
- [ ] Multi-dimensional scoring (Technical, Communication, Confidence, Depth)
- [ ] Red flag detection (blame language, vague responses, overclaiming)
- [ ] Enhanced readiness dashboard with visual heatmaps

### Phase 4: System Design Module (Planned)
- [ ] Architecture question generation for senior roles
- [ ] Guided design flow (Requirements → Architecture → Scalability)
- [ ] Trade-off analysis evaluation

### Phase 5: Premium Features (Planned)
- [ ] Voice-based mock interviews
- [ ] Company-specific interview patterns
- [ ] Long-term memory and adaptive learning
- [ ] Video interview practice with body language analysis

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini**: For providing the AI engine
- **Next.js Team**: For the amazing framework
- **Prisma**: For the excellent ORM
- **MongoDB**: For the flexible database

---

## 📧 Contact

**Project Maintainer**: Your Name  
**Email**: your.email@example.com  
**GitHub**: [@yourusername](https://github.com/yourusername)

---

## ⚠️ Important Notes

### API Quota Limits
- **Gemini 2.5 Flash Free Tier**: 50 requests/day
- **Gemini 1.5 Flash Free Tier**: 1,500 requests/day
- Consider upgrading to paid tier for production use

### Security
- Never commit `.env` files to version control
- Keep your Gemini API key secure
- Use environment variables for all sensitive data

### Database
- MongoDB Atlas free tier (M0) is sufficient for development
- Consider upgrading for production workloads
- Regular backups recommended

---

**Built with ❤️ for aspiring FAANG engineers**
