let students = [];
let readingText = "";

// Upload CSV/JSON
function uploadRIT() {
    const file = document.getElementById("ritUpload").files[0];
    if (!file) return alert("Upload a RIT file first.");
    const reader = new FileReader();
    reader.onload = () => {
        try {
            if(file.name.endsWith(".csv")){
                students = csvToArray(reader.result);
            } else { students = JSON.parse(reader.result); }
            localStorage.setItem("students", JSON.stringify(students));
            alert("RIT data uploaded!");
        } catch(e){ alert("Error parsing file: "+e); }
    };
    reader.readAsText(file);
}

// CSV parser (expects header row: name,overall,informational,vocabulary,literary)
function csvToArray(str, delimiter=','){
    const lines = str.trim().split(/\r?\n/).filter(l=>l);
    const result = [];
    // allow header line
    let start = 0;
    const firstParts = lines[0].split(delimiter).map(s=>s.trim().toLowerCase());
    if(firstParts.includes("name") && (firstParts.includes("overall") || firstParts.includes("informational"))) start = 1;
    for(let i=start;i<lines.length;i++){
        const parts = lines[i].split(delimiter).map(p=>p.trim());
        result.push({
            name: parts[0] || ("Student " + i),
            rit_overall: Number(parts[1]) || 210,
            rit_info: Number(parts[2]) || Number(parts[1]) || 210,
            rit_vocab: Number(parts[3]) || Number(parts[1]) || 210,
            rit_lit: Number(parts[4]) || Number(parts[1]) || 210
        });
    }
    return result;
}

// Upload Reading (txt)
function uploadReading(){
    const file = document.getElementById("readingUpload").files[0];
    if(!file) return alert("Upload a reading first.");
    const reader = new FileReader();
    reader.onload = ()=>{ readingText = reader.result; localStorage.setItem("reading", readingText); alert("Reading uploaded!"); };
    reader.readAsText(file);
}

// Dashboard Table population
window.onload = ()=>{
    const table = document.querySelector("#studentTable tbody");
    if(!table) return;
    students = JSON.parse(localStorage.getItem("students")||"[]");
    students.forEach((s,idx)=>{
        const row = document.createElement("tr");
        row.innerHTML=`
            <td>${s.name}</td>
            <td>${s.rit_overall}</td>
            <td>${s.rit_info}</td>
            <td>${s.rit_vocab}</td>
            <td>${s.rit_lit}</td>
            <td><a class="button" href="student.html?student=${idx}">View Packet</a></td>
        `;
        table.appendChild(row);
    });
};

// Student page logic
if(window.location.pathname.includes("student.html")){
    const params = new URLSearchParams(window.location.search);
    const id = params.get("student");
    students = JSON.parse(localStorage.getItem("students")||"[]");
    const student = students[id];
    readingText = localStorage.getItem("reading")||"";
    if(!student){
      document.getElementById("studentName").textContent = "Student not found";
    } else {
      document.getElementById("studentName").textContent = student.name;
      const leveled = rewriteByRIT(readingText, student);
      document.getElementById("leveledReading").textContent = leveled;
      const questions = generateQuestions(leveled, student);
      document.getElementById("questionSet").innerHTML = questions;
    }
}

// Simple RIT rewrite (heuristic)
function rewriteByRIT(text, student){
    if(!text) return "(No reading uploaded)";
    let result=text;
    // Simplify by replacing long words for lower RIT; basic heuristic only.
    if(student.rit_overall < 210) result = text.replace(/\w{8,}/g,"simple");
    else if(student.rit_overall < 230) result = text.replace(/\w{10,}/g,"medium");
    else result = text.replace(/\w{12,}/g,"advanced");
    return result;
}

// Simple question generator
function generateQuestions(text, student){
    // Returns HTML string of questions appropriate to RIT bands (basic heuristics)
    let openPrompt;
    if(student.rit_overall >= 230) openPrompt = "Analyze how the author develops the theme and cite evidence.";
    else if(student.rit_overall >= 210) openPrompt = "Explain the main idea and provide two supporting details.";
    else openPrompt = "Summarize the passage in one paragraph.";

    return `
        <p><b>1. Fill in the blank:</b> The passage is mainly about ________.</p>
        <p><b>2. Multiple choice:</b> What is the author's purpose?</p>
        <p><b>3. Vocabulary:</b> Define: <i>context</i></p>
        <p><b>4. Open response:</b> ${openPrompt}</p>
    `;
}
