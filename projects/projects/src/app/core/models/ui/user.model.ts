export interface User {
  sno: number;
  userid: number;
  clientId: number;       // <- was clientid
  role: number;
  firstName: string;      // <- was firstname
  lastName: string;       // <- was lastname
  contact: string;
  email: string;
  designation: string;
  projectAccess: string;  // <- was projectaccess
  password?: string;
  profilePhoto: string;   // <- was profilephoto

  username?: string;
  clientName?: string;
  roleName?: string;
}
