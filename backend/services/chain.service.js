/**
 * On-chain confirmation lookups via free public explorers (no API key needed).
 * Returns { found, confirmations, failed } or null when the chain has no
 * supported explorer — those deposits are confirmed manually by an admin.
 */

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) return { __status: res.status };
  return res.json();
}

async function bitcoin(txHash) {
  const tx = await getJson(`https://mempool.space/api/tx/${txHash}`);
  if (tx.__status) return { found: false, confirmations: 0 };
  if (!tx.status?.confirmed) return { found: true, confirmations: 0 };
  const tip = await fetch('https://mempool.space/api/blocks/tip/height').then((r) => r.text());
  return { found: true, confirmations: Math.max(0, Number(tip) - tx.status.block_height + 1) };
}

async function tron(txHash) {
  const tx = await getJson(`https://apilist.tronscanapi.com/api/transaction-info?hash=${txHash}`);
  if (tx.__status || !tx.hash) return { found: false, confirmations: 0 };
  const failed = tx.contractRet && tx.contractRet !== 'SUCCESS';
  return { found: true, failed, confirmations: tx.confirmed ? 20 : Number(tx.confirmations || 0) };
}

async function evm(rpc, txHash) {
  const call = (method, params) =>
    fetch(rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }).then((r) => r.json());
  const receipt = (await call('eth_getTransactionReceipt', [txHash]))?.result;
  if (!receipt) return { found: false, confirmations: 0 };
  const head = parseInt((await call('eth_blockNumber', [])).result, 16);
  const block = parseInt(receipt.blockNumber, 16);
  return { found: true, failed: receipt.status === '0x0', confirmations: Math.max(0, head - block + 1) };
}

const EVM_RPC = {
  erc20: process.env.ETH_RPC_URL || 'https://ethereum-rpc.publicnode.com',
  bep20: process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com',
};

async function checkConfirmations(networkId, txHash) {
  try {
    if (networkId === 'bitcoin') return await bitcoin(txHash);
    if (networkId === 'trc20') return await tron(txHash);
    if (EVM_RPC[networkId]) return await evm(EVM_RPC[networkId], txHash);
    return null;
  } catch (error) {
    console.warn('[chain.service] lookup failed:', error.message);
    return null;
  }
}

/** Refreshes confirmation fields on a pending crypto deposit (mutates + saves). */
async function refreshDeposit(transaction) {
  if (transaction.type !== 'deposit' || transaction.status !== 'pending' || !transaction.crypto?.txHash) {
    return transaction;
  }
  const result = await checkConfirmations(transaction.crypto.network, transaction.crypto.txHash);
  transaction.crypto.lastCheckedAt = new Date();
  if (result) {
    const required = transaction.crypto.requiredConfirmations || 1;
    transaction.crypto.confirmations = result.confirmations;
    transaction.crypto.confirmationStatus = result.failed
      ? 'failed'
      : !result.found
        ? 'awaiting'
        : result.confirmations >= required
          ? 'confirmed'
          : 'confirming';
  }
  await transaction.save();
  return transaction;
}

module.exports = { checkConfirmations, refreshDeposit };
