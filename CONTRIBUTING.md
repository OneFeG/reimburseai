# Contributing to Reimburse AI

Thank you for your interest in contributing to Reimburse AI! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment
4. Create a branch for your changes
5. Make your changes
6. Submit a pull request

## Development Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (optional)
- Git

### Backend Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate      # Mac/Linux
pip install -e ".[dev]"
```

### Frontend Setup

```bash
cd frontend/apps/web
npm install
npm run dev
```

### Web3 Setup

```bash
cd Web3
npm install
npx tsc
```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new receipt upload feature
fix: resolve wallet connection issue
docs: update API documentation
refactor: simplify audit service
```

## Submitting Changes

1. Ensure all tests pass
2. Update documentation if needed
3. Create a Pull Request with a clear description
4. Request review from maintainers

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
How has this been tested?

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests that prove my fix/feature works
- [ ] Documentation has been updated
```

## Style Guidelines

### Python (Backend)

- Follow PEP 8
- Use type hints
- Run `ruff check` before committing
- Maximum line length: 100 characters

### TypeScript (Frontend/Web3)

- Use TypeScript strict mode
- Follow ESLint configuration
- Use functional components for React
- Prefer named exports

### SQL (Migrations)

- Use snake_case for table/column names
- Include comments for complex queries
- Always include RLS policies for new tables

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend/apps/web
npm test
```

### Web3 Tests

```bash
cd Web3
npm test
```

## Questions?

Feel free to open an issue or reach out to the maintainers at dev@reimburse.ai.

---

Thank you for contributing to Reimburse AI! 🚀
