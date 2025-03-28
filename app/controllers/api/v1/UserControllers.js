const db = require("../../../models");
const User = db.user;
const bcrypt = require("bcryptjs");
const sequelize = db.Sequelize;
const cloudinary = require("../../../utils/cloudinary");
const user = require("../../../models/user");
const { Op } = require('sequelize');

// payload format
function format(user) {
  const { id, email,user_id,username } = user;
  return {
    status_code: 200,
    status: "success",
    message: "User login successfully",
    id,
    email,
    user_id,
    username,profilePicture : user.avatar,
    accessToken: "JWT " + user.generateToken(),
  };
}

module.exports = {
  //register user
  userRegister: (req, res) => {
    const registerUserReqBody = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password, // You should still hash the password here before saving
    };
  
    // Check if required fields are present
    if (
      !registerUserReqBody.username ||
      !registerUserReqBody.email ||
      !registerUserReqBody.password
    ) {
      return res.status(400).send({
        message: "Please fill form with username, password, and email",
      });
    }
  
    // Create the user in the database
    User.create(registerUserReqBody)
      .then((user) => {
        // Generate the JWT token for the newly created user
        const token = "JWT " + user.generateToken();
  
        // Return the success message and include the token
        console.log("username",user )
        res.status(201).send({
          message: "User registration success",
          redirectToLogin: true,
          user: format(
            { 
              email: registerUserReqBody.email, 
              generateToken : user.generateToken,
              username: user.username,         
              bio:user.bio,
              profilePicture:user.avatar,
              user_id:user.user_id,
              username:user.username
             
             }), // Adjust format function accordingly
          accessToken: token, // Add the generated token here
        });
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "Error while registering user",
        });
        console.log("this is Error==",err)
      });
  },

  // login user
  userLogin: (req, res) => {
    User.findOne({
      where: { email: req.body.email },
    })
      .then((user) => {
        if (!user) {
          return res.status(401).send({
            status: "failed",
            message: "Authentication failed. User not found.",
          });
        }
        user.checkPassword(req.body.password, (err, isMatch) => {
          if (isMatch && !err) {
            res.json(format(user));
          } else {
            res.status(401).send({
              status: false,
              message: "Authentication failed. Wrong Password.",
            });
          }
        });
      })
      .catch((error) =>
        res.status(400).send({
          status: false,
          message: error,
        })
      );
  },

  // show all public profiles
  getAllProfiles: (req, res) => {

    const content = req.query.name;
    var condition = content
      ? { username: { [Op.iLike]: `%${content}%` } }
      : null;

    User.findAll({
      where: condition,
      attributes: {
        exclude: [
          "birthdate",
          "email",
          "password",
          "gender",
          "address",
          "createdAt",
          "updatedAt",
        ],
        order: sequelize.literal(["username DESC"]),
      },
    })
      .then((data) => {
        res.status(200).send(data);
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || "error while retrive public users",
        });
      });
  },

  // show detail profile
  getProfile: (req, res) => {
    const id = req.params.id;
    User.findOne({
      where: { user_id: id },
      attributes: {
        exclude: [
          "password",
          "email",
          "birthdate",
          "address",
          "createdAt",
          "updatedAt",
        ],
      },
    })
      .then((data) => {
        if (data != null) {
          res.status(200).send(data);
        } else {
          res.status(200).send({
            message: `profile id=${id} unavailable`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || `no user profile id=${id}`,
        });
      });
  },

  getMyProfile: (req, res) => {
    // const userId = reqBodyUserId;
    const id = req.params.id;
    console.log(req.userId);
    // res.send({
    //   data : "ok",
    //   userId: req.userId
    // })

    User.findOne({
      where: { email: req.params.id},
      attributes: {
        exclude: ["password"],
      },
    })
      .then((data) => {
        if (data != null) {
          res.status(200).send(data);
        } else {
          res.status(200).send({
            message: `profile id=${id} unavailable`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || `no user profile id=${id}`,
        });
      });
  },

  //update profile user
  updateProfile: (req, res) => {
    const { id } = req.params;

    User.update(req.body, {
      where: { email: req.params.id },
      attributes: {
        exclude: ["password"],
      },
    })
      .then((num) => {
        if (num == 1) {
          res.send({
            message: `profile user_id=${id} was updated `,
          });
        } else {
          res.send({
            message: `can't update profile user_id=${id}`,
          });
        }
      })
      .catch((err) => {
        res.status(500).send({
          message: err.message || `error update profile`,
        });
      });
  },

  //upload profile pict user
  uploadProfilePict: async (req, res) => {
    try {
      //upload to cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      const { id } = req.params;

      let pictprof = new User({
        avatar: result.secure_url,
        cloudinary_id: result.public_id,
      });

      //
      //debugging
      console.log(
        "\navatar_link:" + pictprof.avatar + "\n",
        "\ncloudinary_id:" + pictprof.cloudinary_id + "\n"
      );

      await User.update(
        {
          avatar: pictprof.avatar,
          cloudinary_id: pictprof.cloudinary_id,
        },
        { where: { user_id: id } }
      )
        .then((num) => {
          if (num == 1) {
            res.send({
              message: `profile user_id=${id} was updated `,
            });
          } else {
            res.send({
              message: `can't update profile user_id=${id}`,
            });
            // res.send(req.file);
          }
        })
        .catch((err) => {
          res.status(500).send({
            message: err.message || `error update profile`,
          });
        });
    } catch (err) {
      console.log(`TEST ERROT UPLOAD MEDIA IMAGE: ${err}`);
    }
  },

  uploadImage : (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update user's profile image based on email
      const userEmail = req.params.id; // Assuming user email is stored in req.user
      const user =  User.findOne({ where: { email: userEmail } });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
       User.update({ avatar: imageUrl }, { where: { email: userEmail } });
      
      res.json({ message: "Image uploaded and assigned to user successfully", imageUrl });
    } catch (error) {
      res.status(500).json({ message: "Error uploading image", error: error.message });
    }
  },
};
