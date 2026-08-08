/* =========================================================
   TKSCT STUDENT PORTAL
   COMPLETE APP.JS
   ========================================================= */

const authView = document.getElementById("authView");
const verifyView = document.getElementById("verifyView");
const resetView = document.getElementById("resetView");
const dashboardView = document.getElementById("dashboardView");

const form = document.getElementById("authForm");
const error = document.getElementById("errorMessage");

let createMode = false;
let loginRole = "student";
let pendingEmail = "";

/* =========================================================
   DEFAULT ATTENDANCE DATA
   ========================================================= */

const defaultRecords = {
    dataStructures: {
        attendance: 92,
        mark: 85
    },
    databaseManagement: {
        attendance: 88,
        mark: 82
    },
    computerNetworks: {
        attendance: 76,
        mark: 74
    },
    mathematics: {
        attendance: 84,
        mark: 79
    }
};

/* =========================================================
   LOCAL STORAGE HELPERS
   ========================================================= */

function getAccount() {
    try {
        return JSON.parse(localStorage.getItem("tksctAccount"));
    } catch {
        return null;
    }
}

function saveAccount(account) {
    localStorage.setItem(
        "tksctAccount",
        JSON.stringify(account)
    );
}

function getRecords() {
    try {
        return JSON.parse(
            localStorage.getItem("tksctRecords")
        ) || structuredClone(defaultRecords);
    } catch {
        return structuredClone(defaultRecords);
    }
}

function saveRecords(records) {
    localStorage.setItem(
        "tksctRecords",
        JSON.stringify(records)
    );
}

/* =========================================================
   AUTH MODE
   ========================================================= */

function setMode(isCreate) {

    createMode = isCreate;

    document.querySelectorAll(".create-only")
        .forEach(el => {
            el.style.display = isCreate ? "" : "none";
        });

    document.querySelectorAll(".login-only")
        .forEach(el => {
            el.style.display = isCreate ? "none" : "";
        });

    const kicker =
        document.getElementById("formKicker");

    const title =
        document.getElementById("formTitle");

    const subtitle =
        document.getElementById("formSubtitle");

    const button =
        document.getElementById("submitButton");

    const switchText =
        document.getElementById("switchText");

    if (isCreate) {

        kicker.textContent = "CREATE ACCOUNT";

        title.textContent = "Create your account";

        subtitle.textContent =
            "Register for the TKSCT student portal.";

        button.innerHTML =
            'Continue <span>→</span>';

        switchText.innerHTML =
            'Already have an account? ' +
            '<button type="button" class="text-link switch-mode">' +
            'Sign in' +
            '</button>';

    } else {

        if (loginRole === "staff") {

            kicker.textContent = "STAFF LOGIN";

            title.textContent = "Welcome back, staff";

            subtitle.textContent =
                "Sign in to manage student academic records.";

        } else {

            kicker.textContent = "STUDENT LOGIN";

            title.textContent = "Welcome back, student";

            subtitle.textContent =
                "Sign in to view your academic dashboard.";
        }

        button.innerHTML =
            'Sign in <span>→</span>';

        switchText.innerHTML =
            loginRole === "staff"
                ? 'New staff? <button type="button" class="text-link switch-mode">Create an account</button>'
                : 'New student? <button type="button" class="text-link switch-mode">Create an account</button>';
    }

    error.textContent = "";
}

/* =========================================================
   LOGIN ROLE
   ========================================================= */

function setLoginRole(role) {

    loginRole = role;

    document
        .querySelectorAll(".login-tab")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.loginRole === role
            );

        });

    setMode(false);
}

/* =========================================================
   SHOW AUTH
   ========================================================= */

function showAuth() {

    authView.hidden = false;

    verifyView.hidden = true;

    resetView.hidden = true;

    dashboardView.hidden = true;

    setMode(false);
}

/* =========================================================
   SHOW VERIFICATION
   ========================================================= */

function showVerification(email) {

    pendingEmail = email;

    authView.hidden = true;

    verifyView.hidden = false;

    resetView.hidden = true;

    dashboardView.hidden = true;

    const verifyEmail =
        document.getElementById("verifyEmail");

    if (verifyEmail) {
        verifyEmail.textContent = email;
    }

    const hint =
        document.getElementById("verifyOtpHint");

    if (hint) {
        hint.textContent =
            "A 6-digit OTP has been sent to your email. " +
            "It expires in 5 minutes.";
    }
}

/* =========================================================
   SHOW DASHBOARD
   ========================================================= */

function showDashboard(user) {

    authView.hidden = true;

    verifyView.hidden = true;

    resetView.hidden = true;

    dashboardView.hidden = false;

    const name =
        user.name || "Student";

    const initial =
        name.charAt(0).toUpperCase();

    document.getElementById(
        "welcomeTitle"
    ).textContent =
        `Good morning, ${name}.`;

    document.getElementById(
        "profileInitial"
    ).textContent =
        initial;

    const kicker =
        document.getElementById("dashboardKicker");

    const subtitle =
        document.getElementById("dashboardSubtitle");

    if (user.role === "staff") {

        kicker.textContent =
            "STAFF DASHBOARD";

        subtitle.textContent =
            "Manage student attendance and academic records.";

        dashboardView.classList.add(
            "staff-mode"
        );

    } else {

        kicker.textContent =
            "STUDENT DASHBOARD";

        subtitle.textContent =
            "Your attendance and academic overview for this semester.";

        dashboardView.classList.remove(
            "staff-mode"
        );
    }

    updateRecordDisplay();
}

/* =========================================================
   SEND REAL EMAIL OTP
   ========================================================= */

async function sendOtp(user) {

    error.textContent = "";

    try {

        const response =
            await fetch("/api/send-otp", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(user)

            });

        const data =
            await response.json();

        if (!response.ok) {

            error.textContent =
                data.message ||
                "Unable to send OTP.";

            return false;
        }

        showVerification(user.email);

        return true;

    } catch (err) {

        console.error(err);

        error.textContent =
            "Server connection failed. " +
            "Make sure the backend is running.";

        return false;
    }
}

/* =========================================================
   VERIFY EMAIL OTP
   ========================================================= */

async function verifyOtp(otp) {

    const message =
        document.getElementById("verifyError");

    message.textContent = "";

    try {

        const response =
            await fetch("/api/verify-otp", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: pendingEmail,
                    otp: otp
                })

            });

        const data =
            await response.json();

        if (!response.ok) {

            message.textContent =
                data.message ||
                "Invalid OTP.";

            return;
        }

        /*
         * Save the returned account locally
         * so the demo dashboard can continue
         * to work in the browser.
         */

        if (data.user) {

            saveAccount({
                ...data.user,
                password: null
            });

        }

        pendingEmail = "";

        document.getElementById(
            "verifyOtp"
        ).value = "";

        showAuth();

        error.textContent =
            "Account created successfully. " +
            "Please sign in.";

    } catch (err) {

        console.error(err);

        message.textContent =
            "Unable to verify OTP. " +
            "Please try again.";
    }
}

/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(
    email,
    password
) {

    error.textContent = "";

    try {

        const response =
            await fetch("/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    email: email,

                    password: password,

                    role: loginRole

                })

            });

        const data =
            await response.json();

        if (!response.ok) {

            error.textContent =
                data.message ||
                "Login failed.";

            return;
        }

        saveAccount({
            ...data.user,
            password: null
        });

        showDashboard(data.user);

    } catch (err) {

        console.error(err);

        /*
         * Fallback for local demo accounts.
         */

        const saved =
            getAccount();

        if (
            saved &&
            saved.email === email &&
            saved.password === password &&
            saved.role === loginRole
        ) {

            showDashboard(saved);

        } else {

            error.textContent =
                "Unable to connect to the server.";
        }
    }
}

/* =========================================================
   MAIN LOGIN / CREATE ACCOUNT FORM
   ========================================================= */

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        error.textContent = "";

        const name =
            document
                .getElementById("name")
                .value
                .trim();

        const email =
            document
                .getElementById("email")
                .value
                .trim()
                .toLowerCase();

        const password =
            document
                .getElementById("password")
                .value;

        const role =
            document
                .getElementById("role")
                .value;

        if (!email || !password) {

            error.textContent =
                "Please enter your email and password.";

            return;
        }

        /* CREATE ACCOUNT */

        if (createMode) {

            if (!name) {

                error.textContent =
                    "Please enter your full name.";

                return;
            }

            if (password.length < 6) {

                error.textContent =
                    "Password must contain at least 6 characters.";

                return;
            }

            const terms =
                document.getElementById("terms");

            if (terms && !terms.checked) {

                error.textContent =
                    "Please accept the terms to continue.";

                return;
            }

            const existing =
                getAccount();

            if (
                existing &&
                existing.email === email
            ) {

                error.textContent =
                    "An account already exists. Please sign in.";

                return;
            }

            await sendOtp({

                name: name,

                email: email,

                password: password,

                role: role

            });

            return;
        }

        /* LOGIN */

        await loginUser(
            email,
            password
        );
    }
);

/* =========================================================
   SWITCH LOGIN / CREATE ACCOUNT
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        if (
            event.target.closest(".switch-mode")
        ) {

            setMode(!createMode);

            return;
        }

        if (
            event.target.closest(
                "[data-back='auth']"
            )
        ) {

            showAuth();

            return;
        }
    }
);

/* =========================================================
   LOGIN TABS
   ========================================================= */

document
    .querySelectorAll(".login-tab")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                setLoginRole(
                    this.dataset.loginRole
                );

            }
        );

    });

/* =========================================================
   SHOW / HIDE PASSWORD
   ========================================================= */

const showPassword =
    document.querySelector(
        ".show-password"
    );

if (showPassword) {

    showPassword.addEventListener(
        "click",
        function () {

            const password =
                document.getElementById(
                    "password"
                );

            const visible =
                password.type === "text";

            password.type =
                visible
                    ? "password"
                    : "text";

            this.textContent =
                visible
                    ? "Show"
                    : "Hide";
        }
    );
}

/* =========================================================
   OTP FORM
   ========================================================= */

const verifyForm =
    document.getElementById(
        "verifyForm"
    );

if (verifyForm) {

    verifyForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const otp =
                document
                    .getElementById(
                        "verifyOtp"
                    )
                    .value
                    .trim();

            if (!/^\d{6}$/.test(otp)) {

                document.getElementById(
                    "verifyError"
                ).textContent =
                    "Enter a valid 6-digit OTP.";

                return;
            }

            await verifyOtp(otp);
        }
    );
}

/* =========================================================
   LOGOUT
   ========================================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            dashboardView.hidden = true;

            authView.hidden = false;

            verifyView.hidden = true;

            resetView.hidden = true;

            form.reset();

            setLoginRole("student");

            setMode(false);

        }
    );
}

/* =========================================================
   ATTENDANCE DISPLAY
   ========================================================= */

function updateRecordDisplay() {

    const data =
        getRecords();

    const subjects = [
        "dataStructures",
        "databaseManagement",
        "computerNetworks",
        "mathematics"
    ];

    let totalAttendance = 0;

    let totalMarks = 0;

    let markCount = 0;

    subjects.forEach(subject => {

        const record =
            data[subject] ||
            {
                attendance: 0,
                mark: 0
            };

        const attendance =
            Number(record.attendance) || 0;

        const mark =
            Number(record.mark) || 0;

        totalAttendance += attendance;

        if (record.mark !== null) {

            totalMarks += mark;

            markCount++;

        }

        const bar =
            document.getElementById(
                `${subject}Bar`
            );

        const text =
            document.getElementById(
                `${subject}Attendance`
            );

        if (bar) {

            bar.style.width =
                `${attendance}%`;
        }

        if (text) {

            text.textContent =
                `${attendance}%`;
        }
    });

    const average =
        subjects.length
            ? Math.round(
                totalAttendance /
                subjects.length
            )
            : 0;

    const averageMark =
        markCount
            ? Math.round(
                totalMarks /
                markCount
            )
            : 0;

    const overall =
        document.getElementById(
            "overallAttendance"
        );

    const avgMark =
        document.getElementById(
            "averageMark"
        );

    if (overall) {

        overall.textContent =
            `${average}%`;
    }

    if (avgMark) {

        avgMark.textContent =
            `${averageMark}%`;
    }

    const classes =
        document.getElementById(
            "classesAttended"
        );

    if (classes) {

        const totalClasses = 100;

        const attended =
            Math.round(
                totalClasses *
                average /
                100
            );

        classes.textContent =
            `${attended}/${totalClasses}`;
    }
}

/* =========================================================
   STAFF SAVE ATTENDANCE / MARKS
   ========================================================= */

const recordForm =
    document.getElementById(
        "recordForm"
    );

if (recordForm) {

    recordForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const subject =
                document.getElementById(
                    "subjectSelect"
                ).value;

            const attendance =
                Number(
                    document.getElementById(
                        "attendanceInput"
                    ).value
                );

            const mark =
                Number(
                    document.getElementById(
                        "marksInput"
                    ).value
                );

            const message =
                document.getElementById(
                    "recordMessage"
                );

            if (
                attendance < 0 ||
                attendance > 100 ||
                mark < 0 ||
                mark > 100
            ) {

                message.textContent =
                    "Attendance and marks must be between 0 and 100.";

                return;
            }

            const records =
                getRecords();

            records[subject] = {

                attendance: attendance,

                mark: mark

            };

            saveRecords(records);

            updateRecordDisplay();

            message.textContent =
                "Academic record saved successfully.";

            recordForm.reset();
        }
    );
}

/* =========================================================
   MARK PRESENT / ABSENT
   ========================================================= */

function markToday(isPresent) {

    const subject =
        document.getElementById(
            "subjectSelect"
        ).value;

    const records =
        getRecords();

    const record =
        records[subject];

    if (!record) return;

    const current =
        Number(record.attendance) || 0;

    record.attendance =
        Math.max(
            0,
            Math.min(
                100,
                current +
                (isPresent ? 1 : -1)
            )
        );

    saveRecords(records);

    updateRecordDisplay();

    const message =
        document.getElementById(
            "recordMessage"
        );

    if (message) {

        message.textContent =
            `${isPresent ? "Present" : "Absent"} marked for today. ` +
            `${record.attendance}% attendance recorded.`;
    }
}

const presentButton =
    document.getElementById(
        "presentButton"
    );

if (presentButton) {

    presentButton.addEventListener(
        "click",
        () => markToday(true)
    );
}

const absentButton =
    document.getElementById(
        "absentButton"
    );

if (absentButton) {

    absentButton.addEventListener(
        "click",
        () => markToday(false)
    );
}

/* =========================================================
   STUDENT MANAGEMENT
   ========================================================= */

let students =
    JSON.parse(
        localStorage.getItem(
            "tksctStudents"
        )
    ) || [];

function saveStudents() {

    localStorage.setItem(
        "tksctStudents",
        JSON.stringify(students)
    );
}

function renderStudents() {

    const list =
        document.getElementById(
            "studentList"
        );

    if (!list) return;

    list.innerHTML = "";

    students.forEach(
        (student, index) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "student-item";

            item.innerHTML = `
                <div>
                    <strong>${escapeHtml(student.name)}</strong>
                    <small>
                        ${escapeHtml(student.email)}
                        •
                        ${escapeHtml(student.semester)}
                    </small>
                </div>

                <button
                    type="button"
                    class="edit-student"
                    data-index="${index}">
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-student"
                    data-index="${index}">
                    Delete
                </button>
            `;

            list.appendChild(item);
        }
    );
}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

const studentForm =
    document.getElementById(
        "studentForm"
    );

if (studentForm) {

    studentForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const name =
                document.getElementById(
                    "studentName"
                ).value.trim();

            const email =
                document.getElementById(
                    "studentEmail"
                ).value.trim();

            const semester =
                document.getElementById(
                    "studentSemester"
                ).value;

            const editId =
                document.getElementById(
                    "editStudentId"
                ).value;

            const message =
                document.getElementById(
                    "studentMessage"
                );

            if (editId === "") {

                students.push({

                    name,

                    email,

                    semester

                });

                message.textContent =
                    "Student added successfully.";

            } else {

                students[
                    Number(editId)
                ] = {

                    name,

                    email,

                    semester

                };

                message.textContent =
                    "Student updated successfully.";
            }

            saveStudents();

            renderStudents();

            studentForm.reset();

            document.getElementById(
                "editStudentId"
            ).value = "";

            document.getElementById(
                "studentSaveButton"
            ).textContent =
                "Add student";
        }
    );
}

/* =========================================================
   EDIT / DELETE STUDENT
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const edit =
            event.target.closest(
                ".edit-student"
            );

        const del =
            event.target.closest(
                ".delete-student"
            );

        if (edit) {

            const index =
                Number(
                    edit.dataset.index
                );

            const student =
                students[index];

            document.getElementById(
                "studentName"
            ).value =
                student.name;

            document.getElementById(
                "studentEmail"
            ).value =
                student.email;

            document.getElementById(
                "studentSemester"
            ).value =
                student.semester;

            document.getElementById(
                "editStudentId"
            ).value =
                index;

            document.getElementById(
                "studentSaveButton"
            ).textContent =
                "Update student";
        }

        if (del) {

            const index =
                Number(
                    del.dataset.index
                );

            if (
                confirm(
                    "Delete this student?"
                )
            ) {

                students.splice(
                    index,
                    1
                );

                saveStudents();

                renderStudents();
            }
        }
    }
);

/* =========================================================
   INITIALIZE
   ========================================================= */

if (
    !localStorage.getItem(
        "tksctRecords"
    )
) {

    saveRecords(
        structuredClone(
            defaultRecords
        )
    );
}

renderStudents();

showAuth();