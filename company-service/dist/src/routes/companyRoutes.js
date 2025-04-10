"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/companyRoutes.ts
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/createCompany", authMiddleware_1.authenticateUser, companyController_1.createCompanyProfile);
router.get("/profile", authMiddleware_1.authenticateUser, companyController_1.getCompanyProfile);
router.put("/updateProfile", authMiddleware_1.authenticateUser, companyController_1.updateCompanyProfile);
router.get("/admin/company", authMiddleware_1.authenticateUser, companyController_1.checkCompanyProfile);
exports.default = router;
