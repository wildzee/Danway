# DanwayEME - Employee Management & Reporting Dashboard

A modern, responsive web application built with Next.js for managing employee attendance and manpower reporting.

## 🌐 Live Demo

**Production URL**: [https://danway-963f6ywqn-mdafjalkhan29-gmailcoms-projects.vercel.app](https://danway-963f6ywqn-mdafjalkhan29-gmailcoms-projects.vercel.app)

**Vercel Dashboard**: [https://vercel.com/mdafjalkhan29-gmailcoms-projects/danway-eme](https://vercel.com/mdafjalkhan29-gmailcoms-projects/danway-eme)

## 📋 Overview

DanwayEME is a comprehensive employee management system that provides:
- **Dashboard Home** - Overview and quick access to key features
- **Attendance Tracking** - Monitor and manage employee attendance
- **Manpower Reporting** - Analyze workforce data and generate reports

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) - Accessible component library
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful icon library
- **Charts**: [Recharts](https://recharts.org/) - Composable charting library
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) - Form validation
- **Date Handling**: [date-fns](https://date-fns.org/) - Modern date utility library
- **Deployment**: [Vercel](https://vercel.com/) - Optimized for Next.js

## 📁 Project Structure

```
DanwayEME/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard home page
│   │   ├── attendance/        # Attendance tracking page
│   │   ├── manpower/          # Manpower reporting page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── header.tsx         # Header navigation
│   │   ├── sidebar.tsx        # Sidebar navigation
│   │   └── ui/                # shadcn/ui components
│   └── lib/                   # Utility functions
├── public/                    # Static assets
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+ installed
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DanwayEME
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎨 Features

### Dashboard
- Clean, modern interface
- Responsive design for all devices
- Dark mode support (via next-themes)
- Intuitive navigation with sidebar and header

### Attendance Page
- Track employee attendance
- View attendance reports
- Filter and search capabilities
- Visual data representation with charts

### Manpower Page
- Workforce analytics
- Manpower distribution reports
- Interactive data visualization
- Export capabilities

### UI Components
Complete set of accessible, customizable components:
- Buttons, Cards, Dialogs
- Forms, Inputs, Selects
- Tables, Charts, Calendars
- Dropdowns, Tooltips, Alerts
- And many more...

## 🚢 Deployment

This project is deployed on Vercel. To deploy your own instance:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

The application will be automatically built and deployed. Vercel will provide you with a production URL.

### Environment Variables

If your application requires environment variables, create a `.env.local` file:

```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=your_api_url
```

## 🔧 Configuration

### Tailwind CSS
Configuration is in `postcss.config.mjs`. The project uses Tailwind CSS 4 with the new CSS-first configuration.

### TypeScript
TypeScript configuration is in `tsconfig.json` with strict mode enabled for better type safety.

### ESLint
ESLint configuration is in `eslint.config.mjs` using the Next.js recommended rules.

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1440px+)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Authors

- **Md Afjal Khan** - [mdafjalkhan29@gmail.com](mailto:mdafjalkhan29@gmail.com)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 📞 Support

For support, email [mdafjalkhan29@gmail.com](mailto:mdafjalkhan29@gmail.com)

---

**Built with ❤️ using Next.js and deployed on Vercel**
