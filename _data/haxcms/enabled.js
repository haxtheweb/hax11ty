module.exports = () => {
  if (process.env.NODE_ENV === "development") {
    return "enabled"
  }
  else {
    return ""
  }
}