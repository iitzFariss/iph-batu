import { workflow, node, trigger, ifElse, newCredential, expr, sticky } from '@n8n/workflow-sdk';

const incoming = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Meeting Webhook', parameters: { httpMethod: 'POST', path: 'iph-batu-rapat', responseMode: 'responseNode', authentication: 'none', options: {} } },
  output: [{ body: { eventId: 'sample-event', phone: '6281234567890', message: 'Undangan rapat', kind: 'invitation', expiresAt: '2099-01-01T00:00:00Z', dryRun: true }, headers: { authorization: '' } }],
});
const digest = node({
  type: 'n8n-nodes-base.crypto', version: 2,
  config: { name: 'Hash Authorization', parameters: { action: 'hash', type: 'SHA256', value: expr("{{ String($json.headers.authorization || '').replace(/^Bearer /, '') }}"), dataPropertyName: 'tokenDigest', encoding: 'hex' } },
  output: [{ tokenDigest: 'sha256' }],
});
const validate = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validate Meeting Request', parameters: { mode: 'runOnceForAllItems', jsCode: `
const input = $('Meeting Webhook').first().json;
if ($input.first().json.tokenDigest !== '__IPH_TOKEN_SHA256__' || !/^Bearer [a-f0-9]{64}$/.test(input.headers.authorization || '')) {
  return [{json:{authorized:false,httpStatus:401,reason:'Unauthorized'}}];
}
const body = input.body || {};
if (!/^[a-zA-Z0-9:_-]{1,128}$/.test(body.eventId || '') || !/^628[0-9]{8,12}$/.test(body.phone || '')
  || typeof body.message !== 'string' || body.message.length < 1 || body.message.length > 4000
  || !['invitation','updated','reminder','broadcast'].includes(body.kind)
  || !Number.isFinite(Date.parse(body.expiresAt)) || Date.parse(body.expiresAt) <= Date.now()) {
  return [{json:{authorized:false,httpStatus:422,reason:'Invalid or expired meeting notification'}}];
}
const cache = $getWorkflowStaticData('global');
cache.receipts = cache.receipts || {};
for (const [key,value] of Object.entries(cache.receipts)) if (value.at < Date.now()-7*86400000) delete cache.receipts[key];
const receipt = cache.receipts[body.eventId];
return [{json:{authorized:true,skipSend:body.dryRun===true || Boolean(receipt),dryRun:body.dryRun===true,
  eventId:body.eventId,chatId:body.phone+'@c.us',message:body.message,messageId:receipt?.messageId || null}}];
` } },
  output: [{ authorized: true, skipSend: true, dryRun: true, eventId: 'sample-event', chatId: '6281234567890@c.us', message: 'Undangan rapat' }],
});
const valid = ifElse({ version: 2.3, config: { name: 'Request Valid', parameters: { conditions: { options: { caseSensitive: true, typeValidation: 'strict', version: 3 }, conditions: [{ leftValue: expr('{{ $json.authorized }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } }, output: [{ authorized: true }] });
const skip = ifElse({ version: 2.3, config: { name: 'Dry Run or Existing Receipt', parameters: { conditions: { options: { caseSensitive: true, typeValidation: 'strict', version: 3 }, conditions: [{ leftValue: expr('{{ $json.skipSend }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } }, output: [{ dryRun: true }] });
const rejected = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Reject Request', parameters: { respondWith: 'json', responseBody: expr('{{ { ok: false, error: $json.reason } }}'), options: { responseCode: expr('{{ $json.httpStatus }}') } } },
  output: [{ ok: false }],
});
const skipped = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Respond Without Sending', parameters: { respondWith: 'json', responseBody: expr('{{ { ok: true, eventId: $json.eventId, dryRun: $json.dryRun, messageId: $json.messageId } }}'), options: { responseCode: 200 } } },
  output: [{ ok: true, dryRun: true }],
});
const send = node({
  type: '@devlikeapro/n8n-nodes-waha.WAHA', version: 202502,
  config: { name: 'Send Meeting WhatsApp', retryOnFail: false, credentials: { wahaApi: newCredential('WAHA account') }, parameters: {
    resource: 'Chatting', operation: 'Send Text', session: '__WAHA_SESSION__',
    chatId: expr("{{ $('Validate Meeting Request').first().json.chatId }}"), text: expr("{{ $('Validate Meeting Request').first().json.message }}"), requestOptions: { timeout: 15000 },
  } },
  output: [{ id: 'provider-message-id' }],
});
const receipt = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Prepare Receipt', parameters: { mode: 'runOnceForAllItems', jsCode: `
const source = $('Validate Meeting Request').first().json;
const response = $input.first().json;
const id = typeof response.id === 'string' ? response.id : response.id?._serialized || response.key?.id;
if (!id) throw new Error('WAHA response did not confirm a message ID; do not resend automatically');
const cache = $getWorkflowStaticData('global');
cache.receipts = cache.receipts || {};
cache.receipts[source.eventId] = {messageId:String(id),at:Date.now()};
return [{json:{ok:true,eventId:source.eventId,messageId:String(id)}}];
` } },
  output: [{ ok: true, eventId: 'sample-event', messageId: 'provider-message-id' }],
});
const success = node({
  type: 'n8n-nodes-base.respondToWebhook', version: 1.5,
  config: { name: 'Confirm Accepted Message', parameters: { respondWith: 'firstIncomingItem', options: { responseCode: 200 } } },
  output: [{ ok: true, eventId: 'sample-event', messageId: 'provider-message-id' }],
});
const guide = sticky('## IPH Batu — undangan dan pengingat rapat\nBackend menyimpan antrean di schema iph_batu dan mengirim POST saat jatuh tempo.\nNomor dan teks divalidasi; token mentah tidak disimpan dalam workflow.\nDry run melewati node WAHA tanpa mengirim pesan.\nNode WAHA memakai kredensial chatbot yang sudah ada; tidak ada trigger pesan masuk.\nTidak ada retry otomatis pada node pengiriman. Periksa eksekusi jika status backend Perlu diperiksa.\nAtur timezone Asia/Jakarta dan nonaktifkan penyimpanan payload eksekusi untuk menjaga data penerima.', [incoming, digest, validate], { color: 3 });

export default workflow('iph-batu-rapat', 'IPH Batu - Undangan dan Pengingat Rapat')
  .add(incoming).to(digest).to(validate).to(valid.onTrue(skip.onTrue(skipped).onFalse(send.to(receipt.to(success)))).onFalse(rejected))
  .add(guide);
