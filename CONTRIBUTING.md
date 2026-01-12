# Contributing to Challenge Tracker

Thank you for your interest in contributing to Challenge Tracker! We welcome contributions from the community.

## How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide detailed steps to reproduce bugs
- Include your environment details (OS, Node.js version, etc.)

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/challenge-tracker.git`
3. Install dependencies: `npm install`
4. Set up your Supabase project (see README.md)
5. Create a feature branch: `git checkout -b feature/your-feature-name`
6. Make your changes
7. Run tests: `npm test`
8. Commit your changes: `git commit -m "Add your commit message"`
9. Push to your fork: `git push origin feature/your-feature-name`
10. Create a Pull Request

### Code Style
- Follow the existing code style
- Use TypeScript for type safety
- Run `npm run lint` before committing
- Write tests for new features

### Pull Request Guidelines
- Provide a clear description of what your PR does
- Reference any related issues
- Ensure all tests pass
- Update documentation if needed

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Project Structure
- `app/` - Next.js app router pages
- `components/` - Reusable React components
- `services/` - API service functions
- `stores/` - Zustand state management
- `utils/` - Utility functions
- `supabase/` - Database migrations and configuration

## Questions?
Feel free to open a GitHub Discussion or reach out to the maintainers.