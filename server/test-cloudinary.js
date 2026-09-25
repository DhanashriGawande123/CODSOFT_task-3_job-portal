require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.uploader.upload("./test-resume.pdf", {
  folder: "job-portal-resumes",
  resource_type: "auto",
})
  .then((result) => {
    console.log("UPLOAD SUCCESS:", result.secure_url);
  })
  .catch((err) => {
    console.log("UPLOAD FAILURE:", err);
  });