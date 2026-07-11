Write Playwright tests for creating a new program on Didaxis Studio.

## App context (from manual inspection)

- Login page: [https://test.didaxis.studio/login](https://test.didaxis.studio/login)
  - Logo: getByRole('img', { name: 'Didaxis Studio' })
  - Heading: getByText('Sign in to your account')
  - Email field: getByRole('textbox', { name: 'Email' }) — placeholder `you@college.edu`
  - Password field: getByRole('textbox', { name: 'Password' }) — placeholder `Your password`
  - Password visibility toggle: button adjacent to password field (no accessible name; avoid in tests unless needed)
  - Sign In button: getByRole('button', { name: 'Sign In' })
  - Error alert (after failed login): getByText('Invalid email or password')
- Programs page: /programs
  - "New Program" button: getByRole('button', { name: '+ New Program' })
  - Create Modal form:
    - Program Name: placeholder='e.g. Computer Science BSc'
    - Description: placeholder='Brief description'
    - Create button: getByRole('button', { name: 'Create' })
  - Edit icon: getByRole('button', {--ai-color: 'var(--mantine-color-blue-light-color)'})
  - Edit Modal form:
    - Program Name: getByLabel('Program Name')
    - Description: getByLabel('Description')
    - Save button: getByRole('button', { name: 'Save' })
    - Cancel button: getByRole('button', { name: 'Cancel' })
    - Delte icon: getByRole('button', {--ai-color: 'var(--mantine-color-red-light-color)'})
  - Delete confirmation dialog: getByText('Delete program')
    - OK button:  getByRole('button', { name: 'OK' })
    - Cancel button:  getByRole('button', { name: 'Cancel' })

## Credentials

Use dotenv. Read email and password from process.env:

- process.env.DIDAXIS_EMAIL
- process.env.DIDAXIS_PASSWORD
Do NOT hardcode credentials in the test file.
Do NOT expose the credentials in the test artifacts such as report and traces. Use placeholders <EMAIL> and <PASSWORD> instead.

## Test plan
See in DS-2-testplan.md

## Requirements

- TypeScript
- Use Playwright locators (getByRole, getByLabel, getByText)
- Login as the first step in each test (or use beforeEach)
- Each test is independent
- Use unique test data with Date.now() suffix
- Save as tests/ds2-edit-program.spec.ts