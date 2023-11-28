const express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const admin = require("firebase-admin");
const serviceAccount = require("./whiteboard-c6194-firebase-adminsdk-j2xxi-e2a759ed67.json");
const bcrypt = require("bcrypt");
const saltRounds = 10; // Salt rounds for bcrypt (adjust as needed)

//Firebase Setting
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add other configurations as needed
});

// Initialize Firebase services (Firestore, Authentication, etc.) as required.
const db = admin.firestore();
const firestore = admin.firestore();

// Initialize other Firebase services...

const app = express();

// Configure Handlebars
const hbs = exphbs.create({
  extname: ".hbs", // Set the file extension for handlebars files
  layoutsDir: "views/layouts", // Set the layouts directory
  defaultLayout: "main", // Specify the default layout file
  // Add any other configuration options you need
});

// Set the view engine to use ExpressHandlebars
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("home"); // Render the home page (home.hbs)
});

// Define routes
//STUDENT
app.get("/studentsignup", (req, res) => {
  res.render("studentsignup"); // Create the signup.handlebars view file
});

// POST request for signup form
app.post("/studentsignup", async (req, res) => {
  try {
    const { email, password, id } = req.body;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user data in Firestore
    await firestore.collection("Students").doc(id).set({
      email,
      hashedPassword,
      // You can add more user details as needed
    });

    // Handle successful signup
    console.log("Successfully stored user data in Firestore for:", email);
    res.redirect("/studentdashboard"); // Redirect to dashboard or desired page after signup
  } catch (error) {
    console.error("Error creating new user:", error);
    // Handle signup error, redirect or render error message
    res.redirect("/studentsignup"); // Redirect to signup page with an error message
  }
});

app.get("/studentsignin", (req, res) => {
  res.render("studentsignin"); // Create the signin.handlebars view file
});

// POST request for signin form
app.post("/studentsignin", async (req, res) => {
  try {
    const { email, password, id } = req.body;

    // Retrieve user data from Firestore using the provided email
    const userDoc = await firestore.collection("Students").doc(id).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const hashedPassword = userData.hashedPassword;

      // Compare the hashed password from Firestore with the input password after hashing
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        // Passwords match - authentication successful
        console.log("User authenticated:", email);
        res.redirect("/studentdashboard"); // Redirect to dashboard or desired page after authentication
      } else {
        // Passwords don't match - authentication failed
        console.log("Incorrect password for:", email);
        res.redirect("/studentsignin"); // Redirect to signin page with an error message
      }
    } else {
      // User not found in Firestore - authentication failed
      console.log("User not found:", email);
      res.redirect("/studentsignup"); // Redirect to signin page with an error message
    }
  } catch (error) {
    console.error("Error signing in:", error);
    // Handle signin error, redirect or render error message
    res.redirect("/studentsignin"); // Redirect to signin page with an error message
  }
});

//LECTURERS
// Sign Up - Render lecturer signup form
app.get("/lecturersignup", (req, res) => {
  res.render("lecturersignup"); // Create the signup.handlebars view file
});

// POST request for signup form
app.post("/lecturersignup", async (req, res) => {
  try {
    const { email, password, facultyId } = req.body;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user data in Firestore
    await firestore.collection("Lecturers").doc(facultyId).set({
      email,
      hashedPassword,
      facultyId,
      // You can add more user details as needed
    });

    // Handle successful signup
    console.log("Successfully stored lecturer data in Firestore for:", email);
    res.redirect("/lecturerdashboard"); // Redirect to dashboard or desired page after signup
  } catch (error) {
    console.error("Error creating new user:", error);
    // Handle signup error, redirect or render error message
    res.redirect("/lecturersignup"); // Redirect to signup page with an error message
  }
});

app.get("/lecturersignin", (req, res) => {
  res.render("lecturersignin"); // Create the signin.handlebars view file
});

// POST request for signin form
app.post("/lecturersignin", async (req, res) => {
  try {
    const { email, password, facultyId } = req.body;

    // Retrieve user data from Firestore using the provided email
    const userDoc = await firestore
      .collection("Lecturers")
      .doc(facultyId)
      .get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const hashedPassword = userData.hashedPassword;

      // Compare the hashed password from Firestore with the input password after hashing
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        // Passwords match - authentication successful
        console.log("User authenticated:", email);
        res.redirect("/lecturerdashboard"); // Redirect to dashboard or desired page after authentication
      } else {
        // Passwords don't match - authentication failed
        console.log("Incorrect password for:", email);
        res.redirect("/lecturersignin"); // Redirect to signin page with an error message
      }
    } else {
      // User not found in Firestore - authentication failed
      console.log("Lecturer not found:", email);
      res.redirect("/lecturersignup"); // Redirect to signin page with an error message
    }
  } catch (error) {
    console.error("Error signing in:", error);
    // Handle signin error, redirect or render error message
    res.redirect("/lecturersignin"); // Redirect to signin page with an error message
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
