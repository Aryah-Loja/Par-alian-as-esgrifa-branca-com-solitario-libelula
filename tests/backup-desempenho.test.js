'use strict';
const assert = require('node:assert/strict');
require('fake-indexeddb/auto');
global.Dexie = require('../vendor/dexie-4.4.5.min.js');global.JSZip = require('../vendor/jszip-3.10.1.min.js');
global.NOME_DELA='Ana';global.NOME_DELE='Gabriel';global.obterOuCriarDataPrimeiroAcesso=async()=> '2026-01-01T00:00:00Z';
global.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};global.gerarIdUnico=p=>p+crypto.randomUUID();
const banco=require('../js/db.js');Object.assign(global,banco);const backup=require('../js/export.js');
async function zipMedia(id,texto,tempo,otimizacao){const blob=new Blob([texto],{type:'video/webm'});const z=new JSZip();z.file('media/'+id+'.webm',new TextEncoder().encode(texto));z.file('manifest.json',JSON.stringify({formato:'poloni-backup',versao:4,configuracoes:{},medias:[{id,tipo:'mensagem_futuro',arquivo:id+'.webm',mimeType:'video/webm',tamanho:blob.size,sha256:await backup.sha256BlobSeguro(blob),criadoEm:10,atualizadoEm:tempo,otimizacao}]}));return z.generateAsync({type:'uint8array'})}
(async()=>{
await banco.db.open();await banco.db.media.clear();await banco.db.configuracoes.clear();
const blob=new Blob(['mesmos bytes'],{type:'video/webm'});await banco.db.media.bulkPut([{id:'a',tipo:'mensagem_futuro',blob,criadoEm:10},{id:'b',tipo:'mensagem_futuro',blob,criadoEm:20}]);
const progresso=[];const zip=await backup.gerarBackupZipBlob({progresso:p=>progresso.push(p)});const parsed=await JSZip.loadAsync(await zip.arrayBuffer(),{checkCRC32:true});const m=JSON.parse(await parsed.file('manifest.json').async('string'));assert.equal(m.medias.length,2);assert.equal(m.medias[0].arquivo,m.medias[1].arquivo);assert.equal(Object.keys(parsed.files).filter(k=>k.startsWith('media/')&&!parsed.files[k].dir).length,1);assert(progresso.some(p=>p.fase==='arquivo'&&p.percentual===100));
await banco.db.media.clear();await backup.aplicarBackupDeZip(await zip.arrayBuffer());assert.equal(await banco.db.media.count(),2);assert.equal(await (await banco.db.media.get('b')).blob.text(),'mesmos bytes');
const antes=await zipMedia('otimizar','original grande',100);await backup.aplicarBackupDeZip(antes);
const origem=await backup.sha256BlobSeguro(new Blob(['original grande']));const destino=await backup.sha256BlobSeguro(new Blob(['menor']));const depois=await zipMedia('otimizar','menor',200,{sha256Original:origem,sha256Otimizado:destino});await backup.aplicarBackupDeZip(depois);assert.equal(await banco.db.media.count(),3);assert.equal(await (await banco.db.media.get('otimizar')).blob.text(),'menor');await backup.aplicarBackupDeZip(antes);assert.equal(await banco.db.media.count(),3,'backup anterior não deve recriar bytes já otimizados');
await backup.aplicarBackupDeZip(await zipMedia('otimizar','edicao nova',300));assert.equal(await (await banco.db.media.get('otimizar')).blob.text(),'edicao nova');await backup.aplicarBackupDeZip(depois);assert.equal(await (await banco.db.media.get('otimizar')).blob.text(),'edicao nova','otimização antiga não pode substituir conteúdo editado depois');
await banco.db.media.put({id:'vazia',tipo:'lembranca',blob:new Blob([])});await assert.rejects(()=>backup.gerarBackupZipBlob(),/vazia/);
console.log('OK deduplicação mantém identidades e restauração; otimização evita reintroduzir originais e preserva edições novas; progresso e rejeição de mídia vazia');banco.db.close();
})().catch(e=>{console.error(e);banco.db.close();process.exitCode=1});
