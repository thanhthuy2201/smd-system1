# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastAPI is a modern, high-performance Python web framework for building APIs. It's built on top of **Starlette** (ASGI framework) and **Pydantic** (data validation). The framework provides automatic OpenAPI documentation, type validation, and full async/await support.

## Development Commands

```bash
# Install dependencies
uv sync

# Run tests
bash scripts/test.sh

# Run tests with HTML coverage report
bash scripts/test-cov-html.sh

# Format code (Ruff + Black)
bash scripts/format.sh

# Check coverage (100% required)
uv run coverage report --fail-under=100
```

## Architecture

### Core Components (`fastapi/`)

- **`applications.py`**: Main `FastAPI` class - the application entry point
- **`routing.py`**: Route handling, path operations, and `APIRouter`
- **`param_functions.py`**: Parameter functions (`Path()`, `Query()`, `Body()`, `Cookie()`, `Header()`, `File()`, `Form()`)
- **`params.py`**: Parameter type definitions extending Pydantic's `FieldInfo`

### Key Subsystems

- **`dependencies/`**: Dependency injection system with graph-based resolution and caching
  - `models.py`: `Dependant` dataclass representing function dependencies
  - `utils.py`: Dependency resolution utilities

- **`security/`**: Authentication implementations
  - OAuth2 (password bearer, authorization code)
  - HTTP authentication (Basic, Bearer, Digest)
  - API key (query, header, cookie)

- **`openapi/`**: Automatic OpenAPI 3.1.0 schema generation
  - `utils.py`: Schema generation from function signatures
  - `docs.py`: Swagger UI and ReDoc integration

- **`_compat/`**: Pydantic v1/v2 compatibility layer

### Design Patterns

1. **Decorator-based routing**: `@app.get()`, `@app.post()`, etc.
2. **Dependency injection**: Reusable dependencies with `Depends()`
3. **Type-driven validation**: Pydantic models for request/response validation
4. **Automatic documentation**: OpenAPI spec generated from type hints

## Testing

- Tests are in `tests/` directory
- Documentation examples in `docs_src/` are tested to ensure they work
- 100% test coverage is required
- Uses pytest with httpx for async HTTP testing

## Key Dependencies

- **starlette** (>=0.40.0): ASGI framework foundation
- **pydantic** (>=2.7.0): Data validation
- **typing-extensions** (>=4.8.0): Backported typing features

## Code Conventions

- Extensive use of Python type hints and `Annotated` types
- Use `Doc()` from `annotated-doc` for parameter documentation
- All documentation examples must be runnable Python files
