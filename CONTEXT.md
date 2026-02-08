# DanwayEME - Project Context & Documentation

## 📖 Project Overview

**Project Name**: DanwayEME  
**Type**: Employee Management & Reporting Dashboard  
**Status**: ✅ Live in Production  
**Created**: February 2026  
**Last Updated**: February 8, 2026

### Purpose
DanwayEME is a web-based employee management system designed to streamline attendance tracking and manpower reporting for organizations. The application provides real-time insights into workforce data through an intuitive, modern interface.

## 🎯 Business Goals

1. **Simplify Attendance Management** - Provide an easy-to-use interface for tracking employee attendance
2. **Workforce Analytics** - Enable data-driven decisions through comprehensive manpower reports
3. **Accessibility** - Ensure the system is accessible from any device, anywhere
4. **Scalability** - Build on a modern tech stack that can grow with business needs

## 🏗️ Architecture

### Frontend Architecture
- **Framework**: Next.js 16 with App Router
- **Rendering**: Server-Side Rendering (SSR) and Static Site Generation (SSG)
- **State Management**: React hooks and context (no external state library needed yet)
- **Styling**: Tailwind CSS 4 with utility-first approach
- **Component Library**: shadcn/ui for consistent, accessible components

### Project Structure Details

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Dashboard home (/)
│   ├── attendance/
│   │   └── page.tsx             # Attendance tracking (/attendance)
│   ├── manpower/
│   │   └── page.tsx             # Manpower reports (/manpower)
│   ├── layout.tsx               # Root layout with metadata
│   └── globals.css              # Global styles and Tailwind directives
│
├── components/
│   ├── header.tsx               # Top navigation bar
│   ├── sidebar.tsx              # Side navigation menu
│   └── ui/                      # shadcn/ui components (50+ components)
│       ├── button.tsx
│       ├── card.tsx
│       ├── table.tsx
│       ├── chart.tsx
│       └── ... (and many more)
│
└── lib/
    └── utils.ts                 # Utility functions (cn, etc.)
```

## 🔑 Key Features

### 1. Dashboard Home Page
- **Location**: `/` (src/app/page.tsx)
- **Features**:
  - Welcome screen
  - Quick navigation to main features
  - Overview statistics (if implemented)
  - Recent activity feed (if implemented)

### 2. Attendance Page
- **Location**: `/attendance` (src/app/attendance/page.tsx)
- **Features**:
  - Employee attendance tracking
  - Date range filtering
  - Attendance status indicators
  - Export functionality
  - Visual charts and graphs

### 3. Manpower Page
- **Location**: `/manpower` (src/app/manpower/page.tsx)
- **Features**:
  - Workforce distribution analysis
  - Department-wise reports
  - Role-based filtering
  - Interactive data visualization
  - Report generation

### 4. Navigation System
- **Header Component**: Top navigation with branding and user actions
- **Sidebar Component**: Left navigation menu with page links
- **Responsive**: Collapses to hamburger menu on mobile devices

## 🎨 Design System

### Color Palette
The application uses Tailwind CSS default colors with customizations:
- **Primary**: Blue shades for main actions
- **Secondary**: Gray shades for secondary elements
- **Success**: Green for positive states
- **Warning**: Yellow for caution states
- **Error**: Red for error states

### Typography
- **Font Family**: Geist (Vercel's font) for modern, clean typography
- **Headings**: Bold weights for hierarchy
- **Body**: Regular weight for readability

### Components
All UI components follow the shadcn/ui design system:
- Accessible by default (ARIA attributes)
- Keyboard navigable
- Consistent spacing and sizing
- Dark mode compatible

## 🔌 Dependencies

### Core Dependencies
```json
{
  "next": "16.1.6",                    // React framework
  "react": "19.2.3",                   // UI library
  "react-dom": "19.2.3",               // React DOM renderer
  "typescript": "^5"                   // Type safety
}
```

### UI & Styling
```json
{
  "tailwindcss": "^4",                 // CSS framework
  "tailwind-merge": "^3.4.0",          // Merge Tailwind classes
  "class-variance-authority": "^0.7.1", // Component variants
  "lucide-react": "^0.563.0",          // Icons
  "next-themes": "^0.4.6"              // Dark mode support
}
```

### Data & Forms
```json
{
  "react-hook-form": "^7.71.1",        // Form handling
  "zod": "^4.3.6",                     // Schema validation
  "date-fns": "^4.1.0",                // Date utilities
  "recharts": "^2.15.4"                // Charts and graphs
}
```

### UI Components (Radix UI)
```json
{
  "radix-ui": "^1.4.3",                // Headless UI primitives
  "react-day-picker": "^9.13.0",       // Date picker
  "cmdk": "^1.1.1",                    // Command menu
  "sonner": "^2.0.7",                  // Toast notifications
  "vaul": "^1.1.2"                     // Drawer component
}
```

## 🚀 Deployment Information

### Production Environment
- **Platform**: Vercel
- **URL**: https://danway-963f6ywqn-mdafjalkhan29-gmailcoms-projects.vercel.app
- **Project Name**: danway-eme
- **Account**: mdafjalkhan29@gmail.com

### Deployment Details
- **Build Time**: ~6 minutes
- **Build Command**: `next build`
- **Output Directory**: `.next` (Next.js default)
- **Node Version**: 20.x (Vercel default)
- **Auto-Deploy**: Enabled (on git push)

### Vercel Configuration
The project uses Vercel's automatic Next.js detection:
- No custom `vercel.json` needed
- Automatic environment detection
- Edge network distribution
- Automatic HTTPS
- CDN caching for static assets

## 📊 Performance Considerations

### Optimization Strategies
1. **Server Components**: Using React Server Components by default for better performance
2. **Code Splitting**: Automatic code splitting by Next.js
3. **Image Optimization**: Next.js Image component for optimized images
4. **Font Optimization**: Using `next/font` for automatic font optimization
5. **CSS Optimization**: Tailwind CSS purges unused styles in production

### Best Practices Implemented
- ✅ TypeScript for type safety
- ✅ ESLint for code quality
- ✅ Responsive design
- ✅ Accessible components
- ✅ SEO-friendly metadata
- ✅ Fast page loads

## 🔐 Security Considerations

### Current Security Measures
- HTTPS enforced by Vercel
- No sensitive data in client-side code
- Environment variables for configuration
- TypeScript for type safety

### Future Security Enhancements
- [ ] Authentication system (NextAuth.js recommended)
- [ ] Authorization and role-based access control
- [ ] API route protection
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Input sanitization

## 🛣️ Development Roadmap

### Phase 1: Foundation ✅ (Completed)
- [x] Project setup with Next.js
- [x] UI component library integration
- [x] Basic page structure
- [x] Navigation system
- [x] Deployment to Vercel

### Phase 2: Core Features (In Progress)
- [ ] Implement attendance tracking logic
- [ ] Add manpower reporting functionality
- [ ] Integrate with backend API
- [ ] Add data persistence
- [ ] Implement search and filtering

### Phase 3: Enhancement (Planned)
- [ ] User authentication
- [ ] Role-based permissions
- [ ] Advanced analytics
- [ ] Export to PDF/Excel
- [ ] Email notifications
- [ ] Mobile app (React Native)

### Phase 4: Optimization (Future)
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (Google Analytics)
- [ ] A/B testing
- [ ] Progressive Web App (PWA)

## 🧪 Testing Strategy

### Current State
- No automated tests yet

### Recommended Testing Approach
1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: Testing Library
3. **E2E Tests**: Playwright or Cypress
4. **Visual Tests**: Chromatic or Percy

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow ESLint rules
- Use functional components with hooks
- Prefer server components unless client interactivity is needed
- Keep components small and focused

### Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)

### Git Workflow
- Main branch: `main`
- Feature branches: `feature/feature-name`
- Bug fixes: `bugfix/bug-description`
- Commit messages: Descriptive and clear

## 🔄 Version History

### v0.1.0 (February 8, 2026)
- Initial project setup
- Dashboard home page
- Attendance page structure
- Manpower page structure
- Navigation components (header, sidebar)
- shadcn/ui component library integration
- Deployed to Vercel

## 📞 Contact & Support

### Project Owner
- **Name**: Md Afjal Khan
- **Email**: mdafjalkhan29@gmail.com
- **Vercel Account**: mdafjalkhan29-gmailcoms-projects

### Resources
- **Production URL**: https://danway-963f6ywqn-mdafjalkhan29-gmailcoms-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/mdafjalkhan29-gmailcoms-projects/danway-eme
- **Repository**: (Add your Git repository URL here)

## 🎓 Learning Resources

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Course](https://nextjs.org/learn)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

### Tailwind CSS
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/)

### shadcn/ui
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Component Examples](https://ui.shadcn.com/examples)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**Last Updated**: February 8, 2026  
**Document Version**: 1.0  
**Maintained By**: Md Afjal Khan
