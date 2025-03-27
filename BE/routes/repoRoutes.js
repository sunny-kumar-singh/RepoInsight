const express=require('express');
const router=express.Router()

const {
  createDocumentation,
  getRepoByname,
  createReadme
} = require("../controllers/repoController");
router.post('/repos',createDocumentation)
router.get("/repos", getRepoByname);
router.post('/reposReadme',createReadme)

module.exports=router