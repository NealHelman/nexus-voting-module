import axios from 'axios';

export async function verifyCIDContentHash(cid, expectedHash, gateway = 'https://ipfs.io/ipfs/') {
  try {
    const url = `${gateway}${cid}`;
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = new Uint8Array(response.data);

    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const actualHash = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return actualHash === expectedHash;
  } catch (error) {
    console.error('IPFS hash verification failed:', error);
    return false;
  }
}
