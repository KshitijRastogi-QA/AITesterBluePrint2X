export const validCredentials = {
  email: process.env.VWO_VALID_EMAIL || '',
  password: process.env.VWO_VALID_PASSWORD || '',
};

export const invalidCredentials = {
  email: process.env.VWO_INVALID_EMAIL || 'invalid@notreal.xyz',
  password: process.env.VWO_INVALID_PASSWORD || 'wrongpassword123',
};

export const edgeCases = {
  emptyEmail: '',
  emptyPassword: '',
  malformedEmail: 'notanemail',
  longPassword: 'A'.repeat(256),
  sqlInjectionEmail: "' OR '1'='1",
  xssEmail: '<script>alert(1)</script>@test.com',
};
