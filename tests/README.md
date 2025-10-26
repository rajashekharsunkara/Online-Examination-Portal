# Testing

This directory contains various types of tests for the exam platform.

## Structure

### `/load` - Load Testing
**Implementation planned for Chunk 18.**

Will contain:
- k6 load testing scripts
- WebSocket connection simulation (3k-5k concurrent)
- Checkpoint throughput tests
- Transfer flow stress tests

### `/e2e` - End-to-End Tests
**Implementation planned for later chunks.**

Will contain:
- Full user journey tests
- Cross-service integration tests
- Critical flow validation

## Running Tests

### Backend Tests
```bash
make test-api
```

### Frontend Tests
```bash
make test-web
```

### Load Tests
```bash
make load-test
```

### All Tests
```bash
make test
```
