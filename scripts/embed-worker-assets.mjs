export function embedWorkerAssets(template, marker, manifest) {
  if (!template.includes(marker)) throw new Error('Worker asset marker is missing.');
  // A replacement string treats `$&`, `$\`` and `$\'` as special tokens.
  // Minified bundles can contain those sequences, so return the JSON from a
  // callback to preserve every embedded asset byte-for-byte.
  return template.replace(marker, () => JSON.stringify(manifest));
}
