import Users from "../../models/users/usersSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const register = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    const existingUser = await Users.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({
        registerSuccess: false,
        message: "이미 존재하는 이메일입니다",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Users.create({ name, email, password: hashedPassword, companyName });

    return res.status(200).json({
      registerSuccess: true,
      message: "회원가입이 완료되었습니다",
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    return res.status(500).json({
      registerSuccess: false,
      message: "서버 오류가 발생했습니다",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const foundUser = await Users.findOne({ email }).lean();

    if (!foundUser) {
      return res
        .status(401)
        .json({ loginSuccess: false, message: "회원이 아닙니다" });
    }

    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (!validPassword) {
      return res
        .status(404)
        .json({ loginSuccess: false, message: "비밀번호가 틀렸습니다" });
    }

    const { password: _, ...userWithoutPassword } = foundUser;

    const accessToken = jwt.sign(userWithoutPassword, "yourSecretKey", {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(userWithoutPassword, "yourRefreshKey", {
      expiresIn: "7d",
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

export { register, login };

// 회원 탈퇴
// const remove = async (req, res) => {
//   const { email } = req.user;
// console.log(req.user)
//   const foundUser = await Users.findOne({ email : email }).lean()
//   console.log("foundUser:", foundUser)
//   const deleteUser = await Users.deleteOne(foundUser)
//   console.log("deleteUser:", deleteUser)

//   res.status(200).json({
//     deleteSuccess : true,
//     message : "회원탈퇴 완료",
//     currentUser : deleteUser
//   })
// }

// 아이디 찾기
// const findId = async (req, res) => {
//   const { name, phone } = req.body
// console.log("req.body", req.body)

//   const foundUser = await User.findOne({ name: name, phone: phone }).lean();
// console.log("foundUser", foundUser)

//   try {

//     if(!foundUser){
//       console.log("일치하는 아이디가 없습니다")
//       return res.status(400).json({
//         findIdSuccess : false,
//         message : "일치하는 아이디가 없습니다",
//       })
//     }else {
//       const { email } = foundUser
//       console.log("일치하는 아이디 :", foundUser)

//       return res.status(200).json({
//         findIdSuccess : true,
//         message : "일치하는 아이디를 찾았습니다",
//         currentUser : email
//       })
//     }
//   } catch (error) {
//     return res.status(500).json({
//       findIdSuccess : false,
//       message : "아이디 찾기 서버 오류"
//     })
//   }

// }

// 관리자 정보 insert
// const adminLogin = async (req, res) => {
//   try {
//     const password = "test123!"
//     const hashedPassword = await bcrypt.hash(password, salt);

// 중복된 관리자가 있는지 확인 후 삽입
//     const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
//     if (existingAdmin) {
//       return res.status(400).json({ message: "관리자가 이미 존재합니다." });
//     }

//     await User.create(adminData);

//     res.status(201).json({ message: "관리자 계정이 성공적으로 생성되었습니다." });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "서버 오류. 다시 시도해 주세요." });
//   }
// }

// 프로필 변경
// const updatePicture = async (req, res) => {
//   const { email } = req.user;

//   const uploadFolder = "uploads/profiles";
//   console.log("req.file", req.file)
//   const relativePath = path.join(uploadFolder, req.file.filename).replaceAll("\\", "/")
//   console.log("relativePath", relativePath)

//   const foundUser = await User.findOne({ email : email }).lean();
//   console.log("foundUser", foundUser)

// 유저를 .updateOne(foundUser, {picture})
//   const updatedPicture = await User.updateOne(
//     { email : email },
//     { picture : relativePath }
//   )

//   console.log("updatedPicture", updatedPicture)

//   res.status(200).json({
//     message : "프로필 이미지 변경이 완료되었습니다",
//     filePath : `/${relativePath}`
//   })

// }
