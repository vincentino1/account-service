export type Account = {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};
