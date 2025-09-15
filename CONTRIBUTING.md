# Contributing to School Management System

We love your input! We want to make contributing to the School Management System as easy and transparent as possible.

## Development Process

We use GitHub to host code, track issues and feature requests, and accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. **Fork the repository** and create your branch from `main`
2. **Clone your fork** locally
3. **Install dependencies** using `npm install`
4. **Create a feature branch**: `git checkout -b feature/amazing-feature`
5. **Make your changes** following our coding standards
6. **Test your changes** thoroughly
7. **Commit your changes**: `git commit -m 'Add amazing feature'`
8. **Push to the branch**: `git push origin feature/amazing-feature`
9. **Open a Pull Request** with a clear description

## Coding Standards

### General Guidelines
- Write clear, readable, and maintainable code
- Follow existing naming conventions
- Add comments for complex logic
- Write tests for new features
- Update documentation as needed

### Frontend (React/TypeScript)
- Use TypeScript for all new components
- Follow React best practices (hooks, functional components)
- Use descriptive component and variable names
- Organize imports: external libraries → internal modules → relative imports
- Use TailwindCSS for styling, avoid custom CSS when possible

### Backend (Node.js)
- Use ES6+ features consistently
- Implement proper error handling
- Add input validation for all endpoints
- Follow RESTful API conventions
- Use meaningful HTTP status codes
- Add JSDoc comments for functions

### Database (MongoDB)
- Design efficient schemas with proper indexing
- Use Mongoose for data validation
- Implement proper relationships between collections
- Write optimized queries

## Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

### Writing Tests
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for good test coverage (>80%)

## Commit Message Guidelines

We follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types:
- `feat`: A new feature
- `fix`: A bug fix  
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

### Examples:
```
feat(auth): add multi-factor authentication

fix(api): resolve user registration validation error

docs(readme): update installation instructions

refactor(components): optimize dashboard performance
```

## Issue Guidelines

### Bug Reports
When filing a bug report, please include:

1. **Bug Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: Browser, OS, Node.js version, etc.
6. **Screenshots**: If applicable
7. **Additional Context**: Any other relevant information

### Feature Requests
When requesting a feature:

1. **Feature Description**: Clear description of the proposed feature
2. **Use Case**: Why this feature would be useful
3. **Proposed Solution**: How you think it should work
4. **Alternative Solutions**: Other approaches you've considered
5. **Additional Context**: Any other relevant information

## Code Review Process

1. **Automated Checks**: All PRs must pass CI/CD checks
2. **Peer Review**: At least one team member must review the PR
3. **Testing**: Ensure all tests pass and new code is tested
4. **Documentation**: Update docs if the PR changes functionality
5. **Breaking Changes**: Clearly document any breaking changes

## Development Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- Git

### Local Development
1. Clone your fork
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Start MongoDB
5. Run demo account setup: `cd backend && node scripts/createAllDemoAccounts.js`
6. Start development servers: `npm run full`

### Environment Variables
Copy `backend/.env.example` to `backend/.env` and configure:

```env
MONGODB_URI=mongodb://localhost:27017/sms_dev
JWT_SECRET=your-development-secret
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

## Architecture Guidelines

### Frontend Architecture
- Use feature-based folder structure
- Implement proper state management with Context API
- Create reusable components in `/components`
- Keep business logic separate from UI components
- Use custom hooks for complex logic

### Backend Architecture  
- Follow MVC pattern (Models, Routes, Controllers)
- Implement middleware for cross-cutting concerns
- Use proper error handling and logging
- Implement input validation and sanitization
- Design RESTful APIs with consistent naming

### Database Design
- Use meaningful collection and field names
- Implement proper indexing for performance
- Design efficient relationships
- Use validation at the schema level
- Consider data migration strategies

## Security Guidelines

- Never commit sensitive information (API keys, passwords)
- Implement proper input validation
- Use parameterized queries to prevent injection
- Implement rate limiting on APIs
- Follow OWASP security best practices
- Regularly update dependencies

## Performance Guidelines

### Frontend Performance
- Use React.memo for expensive components
- Implement proper lazy loading
- Optimize bundle size
- Use efficient re-rendering strategies
- Optimize images and assets

### Backend Performance
- Implement database query optimization
- Use proper caching strategies
- Implement connection pooling
- Monitor API response times
- Use appropriate HTTP status codes

## Documentation

### Code Documentation
- Add JSDoc comments to functions and classes
- Document complex algorithms and business logic
- Keep README files up to date
- Document API endpoints

### User Documentation
- Update user guides when adding features
- Include screenshots for UI changes
- Write clear installation instructions
- Document configuration options

## Community Guidelines

### Be Respectful
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

### Be Collaborative
- Help other contributors
- Share knowledge and best practices
- Provide constructive feedback
- Be patient with newcomers

## Recognition

Contributors who make significant contributions will be:
- Added to the Contributors section in README
- Mentioned in release notes
- Given credit in documentation

## Getting Help

If you need help:
1. Check existing issues and documentation
2. Create a new issue with the `help wanted` label
3. Join our community discussions
4. Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the School Management System! 🎓