module.exports = () => {
  if (process.env.HAXCMS_ENABLED) {
    return "enabled"
  }
  else {
    return ""
  }
}