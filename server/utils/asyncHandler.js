// Lets controllers be plain async functions; rejected promises go to the error middleware.
module.exports = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
