const prodEnvironment = {
  production: true,
};

const devEnvironment = {
  production: false,
};

// This will be replaced with the correct environment object at build time
export const environment = import.meta.env.PROD
  ? prodEnvironment
  : devEnvironment;
