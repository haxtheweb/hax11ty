module.exports = () => {
  if (process.env.HAXCMS_SERVICE_WORKER) {
    return true
  }
  else {
    return false
  }
}