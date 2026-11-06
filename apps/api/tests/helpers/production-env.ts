// Imported before AppModule so env validation and ConfigService see a production API.
// Jest gives each test file its own copy of process.env, so other suites keep NODE_ENV=test.
process.env.NODE_ENV = 'production';
