// Some managed Windows sessions deny the OS account lookup used by tsx.
// Fall back to the process environment only for that lookup; tests stay unchanged.
import os from 'node:os';
import {syncBuiltinESMExports} from 'node:module';
const original = os.userInfo;
try { original(); }
catch (error) {
  if (error?.info?.syscall !== 'uv_os_get_passwd') throw error;
  os.userInfo = () => ({ username: process.env.USERNAME || 'sandbox', homedir: process.env.USERPROFILE || process.cwd(), uid: -1, gid: -1, shell: null });
  syncBuiltinESMExports();
}
