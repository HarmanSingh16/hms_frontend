import { UserRole } from '../types/api';

export interface DemoAccount {
  email: string;
  role: UserRole;
  label: string;
  department?: string;
}

export const DEMO_PASSWORD = 'Password123!';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@hospital.com',
    role: 'admin',
    label: 'Admin (Hospital Director)',
  },
  {
    email: 'reception.clara@hospital.com',
    role: 'receptionist',
    label: 'Receptionist (Clara)',
  },
  {
    email: 'dr.sarah.connor@hospital.com',
    role: 'doctor',
    label: 'Doctor (Dr. Connor)',
    department: 'Cardiology',
  },
  {
    email: 'dr.john.watson@hospital.com',
    role: 'doctor',
    label: 'Doctor (Dr. Watson)',
    department: 'Neurology',
  },
  {
    email: 'alice.smith@example.com',
    role: 'patient',
    label: 'Patient (Alice Smith)',
  },
];

export const DEMO_INVITE_TOKENS = [
  {
    label: 'Elena (Invited Receptionist)',
    token: 'receptionist_elena_invite_token_123',
    role: 'receptionist',
  },
  {
    label: 'Kevin Bacon (Invited Patient)',
    token: 'patient_invite_token_sample_11_Kevin',
    role: 'patient',
  },
];

export const generateSamplePatient = () => {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const firstNames = ['Lucas', 'Maya', 'Ethan', 'Sophia', 'Liam', 'Olivia', 'Noah', 'Emma'];
  const lastNames = ['Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson'];
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];

  return {
    first_name: fn,
    last_name: ln,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randomSuffix}@example.com`,
    date_of_birth: '1992-06-15',
    phone_number: `555${Math.floor(1000000 + Math.random() * 9000000)}`,
    gender: Math.random() > 0.5 ? 'Female' : 'Male',
    address: `${100 + randomSuffix} Maple Avenue, Springfield`,
  };
};
