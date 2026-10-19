const Setting = require('../models/Setting');

const KEY = 'deposit_addresses';

/** Map of "SYMBOL:network" -> { address, enabled } set by admins. */
async function getAddressOverrides() {
  const row = await Setting.findOne({ key: KEY }).lean();
  return (row && row.value) || {};
}

async function setAddressOverride(symbol, networkId, { address, enabled }) {
  const current = await getAddressOverrides();
  const k = `${symbol}:${networkId}`;
  current[k] = {
    address: String(address ?? current[k]?.address ?? '').trim(),
    enabled: enabled === undefined ? current[k]?.enabled !== false : Boolean(enabled),
    updatedAt: new Date().toISOString(),
  };
  await Setting.findOneAndUpdate({ key: KEY }, { key: KEY, group: 'wallet', value: current }, { upsert: true });
  return current;
}

module.exports = { getAddressOverrides, setAddressOverride };
