import express from "express";
import {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  login,
  Logout,
  Register,
} from "../controllers/user.controller.js";
import isAuthenicated from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";
import { addNewPost } from "../controllers/post.controller.js";

const router = express.Router();

// User Router
router.post("/register", Register);
router.post("/login", login);
router.get("/logout", Logout);
router.get("/:id/profile", isAuthenicated, getProfile);
router.post(
  "/profile/edit",
  isAuthenicated,
  upload.single("profilePicture"),
  editProfile
);
router.get("/suggest", isAuthenicated, getSuggestedUsers);
router.post("/followorunfollow/:id", isAuthenicated, followOrUnfollow);


// Post Router

router.post("/addnewpost" , isAuthenicated , addNewPost)

export default router;
