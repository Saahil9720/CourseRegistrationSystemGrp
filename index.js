const express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const admin = require("firebase-admin");
const serviceAccount = require("./whiteboard-c6194-firebase-adminsdk-j2xxi-e2a759ed67.json");
const bcrypt = require("bcrypt");
const saltRounds = 10; // Salt rounds for bcrypt (adjust as needed)
const session = require("express-session");

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
// Use express-session middleware
app.use(
  session({
    secret: "gfygkhvfyguvhjfy456tghjhyfdt4@#234saswS$",
    resave: false,
    saveUninitialized: true,
  })
);
const handlebars = require('handlebars');

// Define the custom helper function
handlebars.registerHelper('inc', function(value) {
  return parseInt(value) + 1;
});
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
    const {
      id,
      email,
      password,
      firstName,
      lastName,
      semester,
      academicYear,
      course1,
      course2,
      // Add more course fields as needed
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store user data including additional fields in Firestore
    await firestore
      .collection("Students")
      .doc(id)
      .set({
        id,
        email,
        hashedPassword,
        firstName,
        lastName,
        semester,
        academicYear,
        courses: [course1, course2], // Store courses in an array
        // Other user details as needed
      });

    // Handle successful signup
    console.log("Successfully stored user data in Firestore for ID:", id);
    res.redirect("/studentdashboard"); // Redirect to dashboard after signup
  } catch (error) {
    console.error("Error creating new user:", error);
    // Handle signup error
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
    const loggedInStudentId = id;

    req.session.studentId = loggedInStudentId;
    // Retrieve user data from Firestore using the provided email
    const userDoc = await firestore.collection("Students").doc(id).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const hashedPassword = userData.hashedPassword;

      // Compare the hashed password from Firestore with the input password after hashing
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        // Passwords match - authentication successful
        console.log("User authenticated:", id);
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

//STUDENT DASHBOARD
app.get("/studentdashboard", async (req, res) => {
  try {
    async function fetchAvailableCourses() {
      try {
        const coursesCollection = firestore.collection("Courses");
        const snapshot = await coursesCollection.get();
    
        const availableCourses = [];
        snapshot.forEach((doc) => {
          const courseData = doc.data();
          const courseID = courseData.courseid;
          availableCourses.push(courseID);
        });
    
        // Render or display the available courses to the student interface
        console.log("Available Courses:", availableCourses);
        return availableCourses;
      } catch (error) {
        console.error("Error fetching available courses:", error);
        // Handle error appropriately, such as displaying an error message to the user
      }
    }

    // Fetch available courses for registration from the database
    const availableCourses = await fetchAvailableCourses(); // Implement this function

    async function fetchRegisteredCourses(studentId) {
      try {
        const studentRef = firestore.collection("Students").doc(studentId);
        const studentDoc = await studentRef.get();

        if (studentDoc.exists) {
          const studentData = studentDoc.data();
          // Assuming 'courses' is the field in the student document that stores registered courses as a list/array
          const registeredCourses = studentData.courses || [];
console.log("Registered Courses:",registeredCourses)
          return registeredCourses;
        } else {
          console.log("Student document not found");
          return [];
        }
      } catch (error) {
        console.error("Error fetching registered courses:", error);
        // Handle error appropriately, such as displaying an error message to the user
        return [];
      }
    }
    // Assuming you have a method to retrieve the student's registered courses from the session or token
    const registeredCourses = await fetchRegisteredCourses(
      req.session.studentId
    ); // Implement this function

    res.render("studentdashboard", { availableCourses, registeredCourses });
  } catch (error) {
    console.error("Error fetching data for student dashboard:", error);
    res.status(500).send("Error fetching data for student dashboard");
  }
});

app.post("/registercourse", async (req, res) => {
  try {
    const { selectedCourse } = req.body;

    // Get the logged-in student's information from the session or token
    const loggedInStudentId = req.session.studentId;

    // Fetch the student's document from Firestore
    const studentRef = firestore.collection("Students").doc(loggedInStudentId);
    const studentDoc = await studentRef.get();
    
    if (studentDoc.exists) {
      const studentData = studentDoc.data();
      const registeredCourses = studentData.registeredCourses || [];
      const availableCourses = studentData.availableCourses || [];

      // Check if the selected course is available
      if (availableCourses.includes(selectedCourse)) {
        // Check if the course has already been registered
        if (!registeredCourses.includes(selectedCourse)) {
          // Assuming a 'registeredCourses' field in the student document to store registered courses
          registeredCourses.push(selectedCourse);

          // Remove the selected course from available courses
          const updatedAvailableCourses = availableCourses.filter(
            (course) => course !== selectedCourse
          );

          // Update 'registeredCourses' and 'availableCourses' fields in the student document
          await studentRef.update({
            registeredCourses: registeredCourses,
            availableCourses: updatedAvailableCourses,
          });

          // Successful registration
          res.redirect("/studentdashboard"); // Redirect to the student dashboard after successful registration
        } else {
          // Course already registered
          res.status(400).send("Course has already been registered.");
        }
      } else {
        // Course not available for registration
        res.status(400).send("Selected course is not available for registration.");
      }
    } else {
      // Student not found
      res.status(404).send("Student not found.");
    }
  } catch (error) {
    console.error("Error registering courses:", error);
    res.status(500).send("An error occurred while registering courses.");
  }
});

// Function to calculate remaining courses allowed based on registered courses and limits
function calculateRemainingCoursesAllowed(
  registeredCourses,
  maxCoursesPerSemester,
  maxCoursesPerAcademicYear
) {
  function getCurrentSemester() {
    // Get the current date
    const currentDate = new Date();

    // Define your semester date ranges (example)
    const springStart = new Date("2023-01-01");
    const springEnd = new Date("2023-05-31");
    const summerStart = new Date("2023-06-01");
    const summerEnd = new Date("2023-08-31");
    const fallStart = new Date("2023-09-01");
    const fallEnd = new Date("2023-12-31");

    // Check the current date against the predefined semester date ranges
    if (currentDate >= springStart && currentDate <= springEnd) {
      return "Spring";
    } else if (currentDate >= summerStart && currentDate <= summerEnd) {
      return "Summer";
    } else if (currentDate >= fallStart && currentDate <= fallEnd) {
      return "Fall";
    } else {
      // Return a default semester or handle other cases as needed
      return "Unknown Semester";
    }
  }

  function getCurrentAcademicYear() {
    // Get the current date
    const currentDate = new Date();

    // Define your academic year boundaries (example)
    const academicYearStart = new Date("2023-09-01");
    const academicYearEnd = new Date("2024-08-31");

    // Check the current date against the predefined academic year boundaries
    if (currentDate >= academicYearStart && currentDate <= academicYearEnd) {
      return "2023-2024";
    } else {
      // Return a default academic year or handle other cases as needed
      return "Unknown Academic Year";
    }
  }

  // Usage
  const currentSemester = getCurrentSemester(); // Retrieve the current semester
  const currentAcademicYear = getCurrentAcademicYear(); // Retrieve the current academic year

  const registeredCoursesInSemester = registeredCourses.filter(
    (course) => course.semester === currentSemester
  ).length;
  const registeredCoursesInAcademicYear = registeredCourses.filter(
    (course) => course.academicYear === currentAcademicYear
  ).length;

  // Calculate remaining courses allowed
  const remainingCoursesInSemester =
    maxCoursesPerSemester - registeredCoursesInSemester;
  const remainingCoursesInAcademicYear =
    maxCoursesPerAcademicYear - registeredCoursesInAcademicYear;

  return Math.min(remainingCoursesInSemester, remainingCoursesInAcademicYear);
}

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
    console.log("Successfully stored lecturer data in Firestore for:", facultyId);
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
        console.log("User authenticated:", facultyId);
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

//LECTURERS DASHBOARD

async function getStudentDetails(studentId) {
  try {
    const docRef = admin.firestore().collection("Students").doc(id);
    const doc = await docRef.get();

    if (doc.exists) {
      const studentData = doc.data();
      return {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        id: studentData.id,
      };
    } else {
      console.log("Student document not found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching student details:", error);
    throw error;
  }
}
app.get("/lecturerdashboard", (req, res) => {
  // TODO: Retrieve courses taught by the logged-in lecturer from the database
  // Render lecturer dashboard with assignment, CAT, exam input forms (lecturerdashboard.hbs)
  res.render("lecturerdashboard");
});
app.post('/create-course', async (req, res) => {
  const { courseid, coursename, coursedescription } = req.body;
  const courseRef = firestore.collection("Courses").doc(courseid);
  await courseRef.set({
    courseid,
    coursename,
    coursedescription
  });
  res.status(200).send("Course created successfully!");
});

app.post("/entergrades/assignments", async (req, res) => {
  try {
    const { assignment1, assignment2 } = req.body;
    const studentId = req.session.studentId; // Get the student ID

    // Example: Store assignment scores in a 'Assignments' collection under the student's document
    const studentRef = firestore.collection("Students").doc(studentId);
    await studentRef.set(
      {
        assignmentScores: {
          assignment1,
          assignment2,
          // Add more assignments as needed
        },
      },
      { merge: true } // Merge with existing data if any
    );

    res.status(200).send("Assignment scores submitted successfully!");
  } catch (error) {
    console.error("Error submitting assignment scores:", error);
    res
      .status(500)
      .send("An error occurred while submitting assignment scores.");
  }
});

app.post("/entergrades/cats", async (req, res) => {
  try {
    const { cat1, cat2 } = req.body;
    const studentId = req.session.studentId; // Get the student ID

    // Example: Store CAT scores in a 'CATs' collection under the student's document
    const studentRef = firestore.collection("Students").doc(studentId);
    await studentRef.set(
      {
        catScores: {
          cat1,
          cat2,
          // Add more CAT scores as needed
        },
      },
      { merge: true } // Merge with existing data if any
    );

    res.status(200).send("CAT scores submitted successfully!");
  } catch (error) {
    console.error("Error submitting CAT scores:", error);
    res.status(500).send("An error occurred while submitting CAT scores.");
  }
});

app.post("/entergrades/exams", async (req, res) => {
  try {
    const { exam } = req.body;
    const studentId = req.session.studentId; // Get the student ID

    // Example: Store the exam score in an 'exams' field under the student's document
    const studentRef = firestore.collection("Students").doc(studentId);
    await studentRef.set(
      {
        examScore: exam,
        // You can add additional exam-related fields here if needed
      },
      { merge: true } // Merge with existing data if any
    );

    res.status(200).send("Exam score submitted successfully!");
  } catch (error) {
    console.error("Error submitting exam score:", error);
    res.status(500).send("An error occurred while submitting exam score.");
  }
});

//ADMIN DASHBOARD
app.get('/admin', (req,res)=>{
  res.render('admindashboard');
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
