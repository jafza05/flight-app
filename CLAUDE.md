# CLAUDE.md - AI Assistant Guide for flight-app

This document provides comprehensive guidance for AI assistants working on the flight-app project. It outlines the codebase structure, development workflows, and key conventions to follow.

## Project Overview

**Project Name:** flight-app
**Repository:** jafza05/flight-app
**Status:** Initial setup phase
**Last Updated:** 2025-11-14

### Purpose
This appears to be a flight-related application. The specific functionality will be documented here as the project evolves.

## Repository Status

This is a newly initialized repository. The codebase structure and technology stack will be documented as development progresses.

**Current State:**
- Initial commit completed
- README.md and LICENSE files present
- No source code yet implemented

## Development Workflow

### Branch Strategy

**Main Branch:** `main` (or master)
**Feature Branches:** Use the pattern `claude/claude-md-{session-id}` for AI-assisted development
**Current Development Branch:** `claude/claude-md-mhz9r4v7qgbma9iv-01N8K89Vp17gWfpmKFge1CfU`

### Git Workflow

1. **Always develop on the designated feature branch**
2. **Commit frequently** with clear, descriptive messages
3. **Push to origin** using: `git push -u origin <branch-name>`
4. **Branch naming is critical** - must start with 'claude/' and match session ID

### Commit Message Conventions

Follow these guidelines for commit messages:
- Use imperative mood ("Add feature" not "Added feature")
- First line: concise summary (50 chars or less)
- Focus on the "why" rather than the "what"
- Examples:
  - "Add user authentication module"
  - "Fix flight search query performance"
  - "Refactor booking service for better error handling"

## Codebase Structure

**To be documented as the project develops.**

Suggested structure for a flight application:

```
flight-app/
├── src/
│   ├── components/     # UI components
│   ├── services/       # Business logic and API calls
│   ├── models/         # Data models
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── tests/              # Test files
├── docs/               # Documentation
└── public/             # Static assets
```

## Technology Stack

**To be determined and documented.**

Potential technologies for a flight app:
- **Frontend:** React, Vue, or Angular
- **Backend:** Node.js, Python (Flask/Django), or Go
- **Database:** PostgreSQL, MongoDB, or MySQL
- **APIs:** Flight data APIs, payment processing
- **Testing:** Jest, Pytest, or similar

## Key Conventions

### Code Style

**To be established based on chosen technology stack.**

General guidelines:
- Use consistent indentation (2 or 4 spaces)
- Follow language-specific style guides (ESLint, Prettier, PEP8, etc.)
- Write self-documenting code with clear variable and function names
- Add comments for complex logic only

### File Naming

- Use lowercase with hyphens for file names: `flight-search.js`
- Component files: PascalCase if using React: `FlightCard.jsx`
- Test files: `*.test.js` or `*.spec.js`
- Configuration files: Descriptive names like `eslint.config.js`

### Error Handling

- Always handle errors gracefully
- Log errors with sufficient context
- Provide user-friendly error messages
- Never expose sensitive information in error messages

### Security Best Practices

When developing features, always consider:
- **Input Validation:** Sanitize all user inputs
- **Authentication:** Implement secure authentication mechanisms
- **Authorization:** Verify user permissions for sensitive operations
- **Data Protection:** Encrypt sensitive data (passwords, payment info)
- **SQL Injection:** Use parameterized queries
- **XSS Prevention:** Escape user-generated content
- **CSRF Protection:** Implement CSRF tokens for state-changing operations
- **Dependency Security:** Regularly update dependencies and scan for vulnerabilities

## Testing Strategy

### Test Coverage Goals
- Unit tests: Aim for >80% coverage
- Integration tests: Cover critical user flows
- E2E tests: Test main user journeys

### Running Tests

**To be documented once testing framework is established.**

Example commands:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## API Documentation

**To be documented as APIs are developed.**

Include:
- Endpoint descriptions
- Request/response formats
- Authentication requirements
- Rate limiting information
- Example requests and responses

## Database Schema

**To be documented once database is designed.**

Key entities for a flight app might include:
- Users
- Flights
- Bookings
- Airports
- Airlines
- Payments

## Environment Variables

**To be documented as needed.**

Example:
```
DATABASE_URL=postgresql://...
API_KEY=...
NODE_ENV=development
PORT=3000
```

Never commit `.env` files to version control.

## AI Assistant Guidelines

### Before Making Changes

1. **Understand the context:** Read related files and understand the current implementation
2. **Plan your approach:** Use TodoWrite to break down complex tasks
3. **Check for existing patterns:** Follow established conventions in the codebase
4. **Consider security:** Review changes for potential security vulnerabilities

### During Development

1. **Make incremental changes:** Small, focused commits are better than large ones
2. **Test as you go:** Verify changes work before moving to the next task
3. **Update documentation:** Keep CLAUDE.md and other docs in sync with code
4. **Follow the style:** Match the existing code style and conventions

### After Implementation

1. **Review your changes:** Check for errors, security issues, and code quality
2. **Run tests:** Ensure all tests pass
3. **Update todos:** Mark tasks as completed
4. **Commit and push:** Use clear commit messages and push to the feature branch

### Common Tasks

**Adding a new feature:**
1. Create or update relevant files
2. Add tests for the new functionality
3. Update documentation
4. Ensure all tests pass
5. Commit with descriptive message

**Fixing a bug:**
1. Reproduce the bug
2. Write a test that fails due to the bug
3. Fix the bug
4. Verify the test now passes
5. Commit with "Fix: " prefix

**Refactoring:**
1. Ensure tests exist for the code being refactored
2. Make incremental changes
3. Run tests after each change
4. Keep commits small and focused
5. Commit with "Refactor: " prefix

## Dependencies Management

**To be documented once dependencies are added.**

- List all production dependencies
- List all development dependencies
- Document the purpose of key dependencies
- Keep dependencies up to date
- Regular security audits

## Deployment

**To be documented once deployment process is established.**

Include:
- Deployment environments (dev, staging, production)
- Deployment process
- Environment-specific configurations
- Rollback procedures

## Troubleshooting

**Common issues and solutions will be documented here as they arise.**

## Resources

**To be added as development progresses.**

- API documentation links
- Design files
- External service documentation
- Team communication channels

## Changelog

Track major changes to this document:

- **2025-11-14:** Initial CLAUDE.md created for newly initialized repository

---

## Notes for AI Assistants

- This is a new project with minimal initial structure
- Be proactive in suggesting appropriate technology stacks based on requirements
- When adding new technologies, update this document accordingly
- Maintain consistency in coding style and architecture patterns
- Always prioritize security and code quality
- Ask clarifying questions when requirements are ambiguous
- Document decisions and rationale for future reference

## Quick Reference

### Essential Commands

**Git:**
```bash
git status                                    # Check current status
git add .                                     # Stage all changes
git commit -m "message"                       # Commit changes
git push -u origin <branch-name>              # Push to remote
```

**To be expanded based on chosen tech stack.**

---

**Remember:** This document should be kept up to date as the project evolves. Update it whenever significant changes are made to the architecture, conventions, or workflows.
