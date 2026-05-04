import assert from "node:assert/strict";

const markdownImagePattern = /!\[[^\]]*]\([^)]+\)/;

async function callChat(message) {
  const response = await fetch("http://127.0.0.1:3000/api/geotherm-chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      debug: true,
      messages: [{ role: "user", content: message }],
    }),
  });

  assert.equal(response.status, 200);
  return response.json();
}

const comfoAir = await callChat("čo je ComfoAir Q?");
assert.ok(!markdownImagePattern.test(comfoAir.message), "ComfoAir message must not contain Markdown image");
assert.equal(comfoAir.images?.length, 1, "ComfoAir image must be available via images field");
assert.equal(comfoAir.images[0].id, "img-zehnder-comfoair-q350");

const recuperationPhoto = await callChat("pošli mi fotku rekuperácie");
assert.ok(!markdownImagePattern.test(recuperationPhoto.message), "Recuperation photo message must not contain Markdown image");
assert.equal(recuperationPhoto.images?.length, 1, "Recuperation image must be available via images field");
assert.equal(recuperationPhoto.images[0].id, "img-zehnder-comfoair-q350");

console.log("PASS API message excludes Markdown images");
console.log("PASS API images field carries selected images");
