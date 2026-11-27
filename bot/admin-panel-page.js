const fs = require("fs");
const path = require("path");

const PAGE_PATH = path.join(__dirname, "admin-panel.html");
const YOUTUBE_PAGE_PATH = path.join(__dirname, "admin-youtube.html");
const STYLES_PATH = path.join(__dirname, "admin-panel.css");

function readPanelPage() {
  return fs.readFileSync(PAGE_PATH, "utf8");
}

function readYoutubePage() {
  return fs.readFileSync(YOUTUBE_PAGE_PATH, "utf8");
}

function readPanelStyles() {
  return fs.readFileSync(STYLES_PATH, "utf8");
}

module.exports = { readPanelPage, readYoutubePage, readPanelStyles };
