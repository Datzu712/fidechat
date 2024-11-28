# U-Chat Test

This is a test project for a chat application built with TypeScript, React, and Vite.

## Prerequisites

- Node.js (>= 22.10.0)
- npm (>= 7.0.0)
or
- Docker (>= 25.0.0)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Datzu712/fidechat-web.git
```

2. Docker
```bash
docker compose up
```

3. NPM
```bash
npm install

npm run dev
# or
npm run build
```

## Considerations
The [backend](https://github.com/Datzu712/Fidechat-backend) should be running in order to use the chat application in the port 8080.

## Scripts

### `dev`
This command starts the Vite development server. Use it during development to have a hot-reloading development environment.
```bash
npm run dev
```

### `build`
This command first compiles the TypeScript project using tsc -b and then builds the application for production using vite build. The output files are placed in the dist directory.
```bash
npm run build
```

### `lint` or `lint:fix`
This command runs ESLint (with Prettier) to check for linting errors in the project. The `lint:fix` command will also attempt to fix any linting errors it finds.
```bash
npm run lint

npm run lint:fix
```

### `preview`
This command starts a local server to preview the built production application. It is useful for verifying how the application will look in a production environment.
```bash
npm run preview
```

## Contributing
If you want to contribute to this project, please follow the steps below:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/feature-name`)
3. Make the appropriate changes in the files
4. Add changes to reflect the changes made (`git add .`)
5. Commit your changes (`git commit -m 'feat: adding a new feature'`)
6. Push to the branch (`git push origin feature/feature-name`)
7. Create a Pull Request