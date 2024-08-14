import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

//  Register Controller
export const Register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields",
        success: false,
      });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Email already exists",
        success: false,
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      password: hashPassword,
    });
    await newUser.save();
    res.status(201).json({
      message: "User registered successfully",
      success: true,
      newUser,
    });
  } catch (error) {
    return res.status(401).json({
      message: "Something Thing went wrong while Register",
      success: false,
    });
  }
};

// login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    const existingUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    };

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.fullName}`,
        success: true,
        existingUser,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "An error occurred during login. Please try again.",
      success: false,
    });
  }
};

// Logout controller
export const Logout = async (req, res) => {
  try {
    res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logout Successfully!",
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during logout. Please try again.",
      success: false,
    });
  }
};

// getProfile controller

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    return res.status(200).json({
      message: "User fetched successfully",
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during getProfile. Please try again.",
      success: false,
    });
  }
};

// updateProfile controller

export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { gender, bio } = req.body;
    const profilePicture = req.file;
    let cloudResponse;
    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "User updated successfully",
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during updateProfile. Please try again.",
      success: false,
    });
  }
};

//  Suggested User controller

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"
    );
    if (!suggestedUsers) {
      return res.status(400).json({
        message: "Currently do not have any users",
      });
    }
    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred during getSuggestedUSer. Please try again.",
      success: false,
    });
  }
};

//  follow or unfollow controller
export const followOrUnfollow = async (req, res) => {
  try {
    const followKrnneWala = req.id;
    const jiskoFollowKrunga = req.params.id;
    if (followKrnneWala === jiskoFollowKrunga) {
      return res.status(400).json({
        message: "Cannot follow/unfollow yourself",
        success: false,
      });
    }

    const user = await User.findById(followKrnneWala);
    const targetUser = await User.findById(jiskoFollowKrunga);
    if (!user || !targetUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // check karna follow or unfollow karu

    const isfollowing = user.following.includes(jiskoFollowKrunga);

    if (isfollowing) {
      // unfollow
      await Promise.all([
        User.updateOne(
          { _id: followKrnneWala },
          { $pull: { following: jiskoFollowKrunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $pull: { followers: followKrnneWala } }
        ),
      ]);
      return res.status(200).json({
        message: "Unfollowed successfully",
        success: true,
      });
    } else {
      // follow
      await Promise.all([
        User.updateOne(
          { _id: followKrnneWala },
          { $push: { following: jiskoFollowKrunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrunga },
          { $push: { followers: followKrnneWala } }
        ),
      ]);
      return res.status(200).json({
        message: "Followed successfully",
        success: true,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        "An error occurred during follow or Unfollow User. Please try again.",
      success: false,
    });
  }
};
