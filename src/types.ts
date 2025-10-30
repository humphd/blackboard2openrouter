export interface BlackboardStudent {
  lastName: string;
  firstName: string;
  username: string;
  studentId: string;
  email: string;
}

export interface ProcessOptions {
  provisioningKey?: string;
  limit: number;
  courseCode: string;
  section: string;
  term: string;
  date?: string;
  output?: string;
  emailDomain?: string;
}

export interface KeyRecord {
  name: string;
  key: string;
  hash: string;
  username: string;
  studentId: string;
  email: string;
}
