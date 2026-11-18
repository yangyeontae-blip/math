import base from './playwright.config.mjs';
// Reuse the isolated local servers during the design verification batch.
export default {...base,webServer:process.env.BERRY_DESIGN_EXTERNAL_SERVERS==='1'?undefined:base.webServer.map(server=>({...server,reuseExistingServer:true}))};
