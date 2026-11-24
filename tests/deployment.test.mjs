import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,request} from './harness.mjs';
test('pending production deployment serves public resources but never guest/login/game rewards',()=>setup(async c=>{
 const h=await request(c.base,'/healthz');assert.equal(h.status,200);assert.equal(h.data.appId,'6af75cf50efc7c0001051c74');assert.equal(h.data.authentication.mode,'pending');assert.equal(h.data.authentication.ready,false);
 const config=await request(c.base,'/v1/config');assert.equal(config.data.apiBase,'https://ono.phizminiapp.com');assert.equal(config.data.loginReady,false);
 assert.equal((await request(c.base,'/v1/campaign')).status,200);
 assert.equal((await fetch(c.base+'/assets/brand/ono-logo.png')).status,200);
 for(const [path,body] of [['/v1/auth/guest',{name:'No guest'}],['/v1/auth/finclip',{name:'No login',code:'test-code'}],['/v1/game',{op:'christmasTaskClaim',submission:'any'}],['/v1/invitations',{roomId:'any'}]]){const r=await request(c.base,path,null,body);assert.equal(r.status,503);assert.equal(r.data.error,'authNotConfigured');}
 assert.equal(c.sql.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
},{NODE_ENV:'production',ALLOW_DEV_GUESTS:'false',AUTH_MODE:'pending',PUBLIC_BASE_URL:'https://ono.phizminiapp.com',FINCLIP_APP_ID:'6af75cf50efc7c0001051c74',AUTH_EXCHANGE_URL:'',AUTH_EXCHANGE_TOKEN:''}));
