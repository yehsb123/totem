import Users from "../../models/users/usersSchema.js";
import bcrypt from "bcrypt";
import {
  signAccessToken,
  signRefreshToken,
} from "../../utils/jwt.js";

// 회원가입
const register = async (req, res) => {
  try {
    const { name, email, password, companyName, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        registerSuccess: false,
        message: "이름, 이메일, 비밀번호는 필수입니다.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        registerSuccess: false,
        message: "비밀번호는 8자 이상이어야 합니다.",
      });
    }

    const existingUser = await Users.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        registerSuccess: false,
        message: "이미 존재하는 이메일입니다",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Users.create({
      name,
      email,
      password: hashedPassword,
      companyName,
      phone,
    });

    return res.status(201).json({
      registerSuccess: true,
      message: "회원가입이 완료되었습니다",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    return res.status(500).json({
      registerSuccess: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ loginSuccess: false, message: "이메일과 비밀번호를 입력해주세요." });
    }

    const foundUser = await Users.findOne({ email }).lean();

    if (!foundUser) {
      return res
        .status(401)
        .json({ loginSuccess: false, message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    if (foundUser.status === "suspended") {
      return res
        .status(403)
        .json({ loginSuccess: false, message: "정지된 계정입니다." });
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ loginSuccess: false, message: "이메일 또는 비밀번호가 일치하지 않습니다." });
    }

    const { password: _, ...userWithoutPassword } = foundUser;

    const accessToken = signAccessToken({
      _id: foundUser._id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
    });
    const refreshToken = signRefreshToken({
      _id: foundUser._id,
      email: foundUser.email,
    });

    return res.status(200).json({
      loginSuccess: true,
      message: "로그인 성공",
      accessToken,
      refreshToken,
      currentUser: userWithoutPassword,
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    return res.status(500).json({ loginSuccess: false, message: "서버 오류" });
  }
};

// 프로필 조회
const getProfile = async (req, res) => {
  try {
    const user = await Users.findById(req.user._id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// 프로필 수정
const updateProfile = async (req, res) => {
  try {
    const { name, companyName, phone, notifications } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (phone !== undefined) updateData.phone = phone;
    if (notifications !== undefined) updateData.notifications = notifications;

    const user = await Users.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    return res.status(200).json({
      success: true,
      message: "프로필이 수정되었습니다.",
      data: user,
    });
  } catch (error) {
    console.error("프로필 수정 오류:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// 비밀번호 변경
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "현재 비밀번호와 새 비밀번호를 입력해주세요." });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: "새 비밀번호는 8자 이상이어야 합니다." });
    }

    const user = await Users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "현재 비밀번호가 일치하지 않습니다." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// 회원 탈퇴
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "비밀번호를 입력해주세요." });
    }

    const user = await Users.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "비밀번호가 일치하지 않습니다." });
    }

    await Users.deleteOne({ _id: req.user._id });

    return res.status(200).json({ success: true, message: "회원탈퇴가 완료되었습니다." });
  } catch (error) {
    console.error("회원탈퇴 오류:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

// 아이디 찾기 (이름 + 전화번호)
const findEmail = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "이름과 전화번호를 입력해주세요." });
    }

    const user = await Users.findOne({ name, phone }).select("email").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "일치하는 사용자를 찾을 수 없습니다." });
    }

    // 이메일 마스킹 (abc***@gmail.com)
    const [local, domain] = user.email.split("@");
    const maskedLocal =
      local.length <= 3
        ? local[0] + "***"
        : local.slice(0, 3) + "***";
    const maskedEmail = `${maskedLocal}@${domain}`;

    return res.status(200).json({
      success: true,
      message: "이메일을 찾았습니다.",
      email: maskedEmail,
    });
  } catch (error) {
    console.error("아이디 찾기 오류:", error);
    return res.status(500).json({ success: false, message: "서버 오류" });
  }
};

export {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  findEmail,
};
