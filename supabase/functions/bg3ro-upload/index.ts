import { createUploadHandler } from './handler.js';
Deno.serve(createUploadHandler({ env: (name) => Deno.env.get(name), fetch }));
