// Optional preload for restricted Windows runners where uv_os_get_passwd is unavailable.
// Does not affect game code or assertions. Keep all tooling caches inside this worktree.
const os = require('node:os');
const original = os.userInfo;
try { original(); } catch {
  os.userInfo = () => ({username:process.env.USERNAME || 'local-runner',uid:-1,gid:-1,shell:null,homedir:process.cwd()});
}
