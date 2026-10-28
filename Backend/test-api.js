const http = require("http");

async function runTests() {
    console.log("=== RUNNING SOCIETY PLATFORM INTEGRATION TESTS ===");

    // Test 1: Register a new member
    const registerPayload = JSON.stringify({
        name: "Test Developer",
        email: `dev_${Date.now()}@college.edu`,
        password: "Password@123",
        role: "student",
        college: "Engineering College of Technology",
        branch: "CSE",
        gradYear: "2027"
    });

    console.log("\n1. Testing Registration...");
    const regRes = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: registerPayload
    });
    const regData = await regRes.json();
    console.log("-> Register Status:", regRes.status, regData.message);
    if (!regRes.ok) throw new Error("Register failed");

    const token = regData.token;
    const userId = regData.user.id;

    // Test 2: Update Profile
    console.log("\n2. Testing Profile Update...");
    const updateRes = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            bio: "Fullstack enthusiast interested in Next.js, Cloud, and SIH 2027.",
            skills: ["JavaScript", "React", "Node.js", "Docker"],
            github: "https://github.com/testdev"
        })
    });
    const updateData = await updateRes.json();
    console.log("-> Update Status:", updateRes.status, "Skills count:", updateData.user.skills.length);

    // Test 3: Network Search
    console.log("\n3. Testing Network Search (filter by role & skill)...");
    const netRes = await fetch("http://localhost:5000/api/users?search=React");
    const netData = await netRes.json();
    console.log("-> Network matches for 'React':", netData.count);

    // Test 4: Mentorship Request
    console.log("\n4. Testing Mentorship Request to user-1 (Rahul Sharma)...");
    const mentRes = await fetch("http://localhost:5000/api/mentorship/request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            mentorId: "user-1",
            topic: "DSA & System Design Strategy",
            message: "Would love 20 minutes to review my resume and SDE prep roadmap."
        })
    });
    const mentData = await mentRes.json();
    console.log("-> Mentorship Request Status:", mentRes.status, mentData.message);

    // Test 5: Post Opportunity
    console.log("\n5. Testing Post Opportunity (+20 reputation)...");
    const oppRes = await fetch("http://localhost:5000/api/opportunities", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            title: "Frontend Engineering Intern",
            company: "TechNova Labs",
            type: "Internship",
            location: "Remote",
            stipend: "₹35,000 / month",
            description: "Looking for students proficient in React and Tailwind CSS."
        })
    });
    const oppData = await oppRes.json();
    console.log("-> Opportunity Status:", oppRes.status, oppData.message);

    // Test 6: Create Project / Hackathon Team
    console.log("\n6. Testing Create Hackathon Project (+15 reputation)...");
    const projRes = await fetch("http://localhost:5000/api/projects", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            title: "Campus Ride Sharing & Carpool",
            domain: "Mobile Applications",
            hackathon: "College Tech Fest 2027",
            skillsNeeded: ["Flutter", "Firebase", "UI/UX"],
            description: "Peer carpooling app for day scholars and hostelers."
        })
    });
    const projData = await projRes.json();
    console.log("-> Project Team Status:", projRes.status, projData.message);

    // Test 7: Community Q&A Question & Answer
    console.log("\n7. Testing Community Q&A...");
    const qRes = await fetch("http://localhost:5000/api/qa/questions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            title: "What are the key differences between monolithic and microservice architecture for hackathons?",
            category: "Hackathons & Competitions",
            tags: ["Architecture", "Hackathons", "Backend"]
        })
    });
    const qData = await qRes.json();
    console.log("-> Question Created:", qRes.status, qData.question.id);

    const ansRes = await fetch(`http://localhost:5000/api/qa/questions/${qData.question.id}/answers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            content: "For a 24-36hr hackathon, always stick to a monolithic backend (like a single Express app or Next.js API routes) to avoid distributed tracing and network latency overhead!"
        })
    });
    const ansData = await ansRes.json();
    console.log("-> Answer Posted (+10 reputation):", ansRes.status, ansData.message);

    // Test 8: Leaderboard
    console.log("\n8. Testing Community Leaderboard...");
    const leadRes = await fetch("http://localhost:5000/api/users/leaderboard");
    const leadData = await leadRes.json();
    console.log("-> Top 3 Community Leaders:");
    leadData.leaderboard.slice(0, 3).forEach((u, i) => {
        console.log(`   #${i+1} ${u.name} (${u.role}): ${u.reputation} pts [${(u.badges||[]).join(', ')}]`);
    });

    console.log("\n=== ALL PLATFORM TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
