// Escapes regex special characters so user search input can't be used to
// build a pathological/catastrophic-backtracking regex (ReDoS) or otherwise
// change the meaning of a $regex query.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { escapeRegex };
