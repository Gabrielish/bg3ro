const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {createUploadHandler}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('supabase/functions/bg3ro-upload/handler.js','utf8')).toString('base64'));
 const owner='73ce4438-cb0e-4556-8f47-33fb03532ac1',commit='a'.repeat(40),sha='b'.repeat(40);
 let user=owner,moderator=true,token='server-secret-test',existing=false,puts=[],calls=[];
 const handler=createUploadHandler({env:name=>({SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'public-key',GITHUB_UPLOAD_TOKEN:token})[name],fetch:async(url,options)=>{
  calls.push(url);
  if(url.endsWith('/auth/v1/user'))return Response.json({id:user});
  if(url.endsWith('/rpc/bg3ro_is_moderator'))return Response.json(moderator);
  if(options.method==='PUT'){puts.push(JSON.parse(options.body));assert.equal(options.headers.Authorization,'Bearer server-secret-test');return Response.json({commit:{sha:commit}});}
  return existing?Response.json({type:'file',sha}):new Response(null,{status:404});
 }});
 const request=(headers={},body=new Uint8Array([80,75,3,4,0,0]))=>new Request('https://test.supabase.co/functions/v1/bg3ro-upload',{method:'POST',headers:{origin:'https://gabrielish.github.io',authorization:'Bearer signed-user-token','x-file-name':'translation.zip',...headers},body});
 assert.equal((await handler(new Request('https://test/upload',{method:'POST'}))).status,401);
 assert.equal((await handler(request({origin:'https://evil.example'}))).status,403);
 user='attacker';assert.equal((await handler(request())).status,403);user=owner;
 moderator=false;assert.equal((await handler(request())).status,403);moderator=true;
 token='';assert.equal((await handler(request())).status,503);token='server-secret-test';
 assert.equal((await handler(request({'x-file-name':'..%2Fsecret.zip'}))).status,400);
 assert.equal((await handler(request({'content-length':String(21*1048576)}))).status,413);
 assert.equal((await handler(request({},new Uint8Array([1,2,3,4])))).status,400);
 assert.equal(puts.length,0,'Rejected requests never write GitHub');
 let response=await handler(request());assert.equal(response.status,200);let data=await response.json();assert.equal(data.file_bytes,6);assert.equal(data.replaced,false);assert(data.download_url.includes(commit));assert.equal(puts[0].sha,undefined);assert(!JSON.stringify(data).includes('server-secret-test'));
 existing=true;response=await handler(request());assert.equal(response.status,200);data=await response.json();assert.equal(data.replaced,true);assert.equal(puts[1].sha,sha);assert.equal(puts[1].branch,'main');assert.equal(Buffer.from(puts[1].content,'base64')[0],80);
 assert(calls.filter(s=>s.includes('api.github.com')).every(s=>s.includes("Baldur's%20Gate%203%20Romanian%20Translate/translation.zip")));
 console.log('PASS: server-validated owner and moderator, CORS, missing secret, archive size/signatures, traversal protection, safe GitHub path, overwrite SHA and pinned download. No real upload.');
})().catch(e=>{console.error(e);process.exitCode=1;});
