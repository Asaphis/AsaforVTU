const express = require("express");
const fs = require("fs");
const path = require("path");

function serveStatic(app) {
  const distPath = path.resolve(__dirname, "../dist/public");
  console.log("Looking for static files at:", distPath);
  if (!fs.existsSync(distPath)) {
    throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

module.exports = serveStatic;
