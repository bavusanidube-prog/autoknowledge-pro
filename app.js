import {
loginUser,
signupUser,
logoutUser,
watchAuthState,
saveReport,
getMyReports
} from "./firebase.js";

const el = {
email: document.getElementById("email"),
password: document.getElementById("password"),
userStatus: document.getElementById("userStatus"),
logoutBtn: document.getElementById("logoutBtn"),
authMessage: document.getElementById("authMessage"),
reportMessage: document.getElementById("reportMessage"),

fault: document.getElementById("fault"),
result: document.getElementById("result"),
confidence: document.getElementById("confidence"),
aiExplain: document.getElementById("aiExplain"),
steps: document.getElementById("steps"),

code: document.getElementById("code"),
codeOut: document.getElementById("codeOut"),

reportSearch: document.getElementById("reportSearch"),
reportSort: document.getElementById("reportSort"),
reportList: document.getElementById("reportList"),

loginBtn: document.getElementById("loginBtn"),
signupBtn: document.getElementById("signupBtn"),
runAiBtn: document.getElementById("runAiBtn"),
saveReportBtn: document.getElementById("saveReportBtn"),
lookupBtn: document.getElementById("lookupBtn"),
loadReportsBtn: document.getElementById("loadReportsBtn"),
exportPdfBtn: document.getElementById("exportPdfBtn")
};

let lastReport = null;
let allReports = [];

const diagnostics = {
overheat:{
fault:"Cooling System Failure",
confidence:92,
explanation:"Likely thermostat, coolant loss, blocked radiator or weak water pump.",
steps:"1. Check coolant level\n2. Check leaks\n3. Test thermostat\n4. Inspect radiator fan\n5. Test water pump"
},
no_start:{
fault:"Starting / Fuel Delivery Fault",
confidence:89,
explanation:"Likely battery voltage issue, starter fault, immobilizer or no fuel.",
steps:"1. Check battery voltage\n2. Inspect starter relay\n3. Verify spark\n4. Verify fuel pressure"
},
misfire:{
fault:"Ignition or Fuel Misfire",
confidence:94,
explanation:"Likely spark plugs, coils, injectors, vacuum leak or compression issue.",
steps:"1. Check plugs\n2. Test coils\n3. Check injector pulse\n4. Compression test"
},
battery:{
fault:"Battery Drain / Charging Fault",
confidence:87,
explanation:"Likely parasitic drain, battery wear or alternator issue.",
steps:"1. Test battery health\n2. Check alternator output\n3. Perform drain test"
},
rough_idle:{
fault:"Idle Air/Fuel Imbalance",
confidence:88,
explanation:"Likely vacuum leak, dirty throttle body, MAF issue or weak ignition.",
steps:"1. Inspect vacuum leaks\n2. Clean throttle body\n3. Test MAF\n4. Inspect ignition"
}
};

const obdCodes = {
P0300:"Random/Multiple Cylinder Misfire",
P0171:"System Too Lean Bank 1",
P0420:"Catalyst Efficiency Below Threshold",
P0101:"MAF Range / Performance",
P0500:"Vehicle Speed Sensor Fault"
};

function msg(target,text,type=""){
target.className="message";
if(type) target.classList.add(type);
target.textContent=text;
}

function loading(btn,state,text="Loading..."){
if(state){
btn.dataset.old=btn.textContent;
btn.textContent=text;
btn.disabled=true;
}else{
btn.textContent=btn.dataset.old;
btn.disabled=false;
}
}

function runAI(){
const item = diagnostics[el.fault.value];

if(!item) return;

lastReport = item;

el.result.textContent = item.fault;
el.confidence.textContent = item.confidence + "%";
el.aiExplain.textContent = item.explanation;
el.steps.textContent = item.steps;

el.saveReportBtn.disabled = false;

msg(el.reportMessage,"Analysis complete. Ready to save.","success");
}

async function login(){
loading(el.loginBtn,true,"Logging in...");

try{
await loginUser(el.email.value,el.password.value);
msg(el.authMessage,"Logged in successfully.","success");
}catch(error){
msg(el.authMessage,error.message,"error");
}

loading(el.loginBtn,false);
}

async function signup(){
loading(el.signupBtn,true,"Creating...");

try{
await signupUser(el.email.value,el.password.value);
msg(el.authMessage,"Account created.","success");
}catch(error){
msg(el.authMessage,error.message,"error");
}

loading(el.signupBtn,false);
}

async function logout(){
await logoutUser();
msg(el.authMessage,"Logged out.","success");
}

async function save(){
if(!lastReport){
msg(el.reportMessage,"Run analysis first.","error");
return;
}

loading(el.saveReportBtn,true,"Saving...");

try{
await saveReport(lastReport);
msg(el.reportMessage,"Saved to cloud.","success");
}catch(error){
msg(el.reportMessage,error.message,"error");
}

loading(el.saveReportBtn,false);
}

function renderReports(list){
el.reportList.innerHTML="";

if(!list.length){
el.reportList.innerHTML="<p>No reports found.</p>";
return;
}

list.forEach(r=>{

const card=document.createElement("div");
card.className="report-card";

card.innerHTML=`
<h3>${r.fault}</h3>
<div class="report-meta">Confidence: ${r.confidence}%</div>
<div class="report-meta">${r.explanation}</div>
<pre>${r.steps}</pre>
`;

el.reportList.appendChild(card);

});
}

async function loadReports(){
loading(el.loadReportsBtn,true,"Loading...");

try{
allReports = await getMyReports();
applyFilters();
}catch(error){
msg(el.reportMessage,error.message,"error");
}

loading(el.loadReportsBtn,false);
}

function applyFilters(){

let list=[...allReports];

const q = el.reportSearch.value.toLowerCase();

if(q){
list=list.filter(r =>
(r.fault || "").toLowerCase().includes(q) ||
(r.explanation || "").toLowerCase().includes(q)
);
}

if(el.reportSort.value==="confidence"){
list.sort((a,b)=>b.confidence-a.confidence);
}

renderReports(list);
}

function lookup(){

const codes = el.code.value
.split(",")
.map(x=>x.trim().toUpperCase())
.filter(Boolean);

if(!codes.length){
el.codeOut.textContent="Enter a code.";
return;
}

let out="";

codes.forEach(c=>{
out += c + " = " + (obdCodes[c] || "Unknown code") + "\n";
});

el.codeOut.textContent = out;
}

function exportPDF(){

if(!allReports.length){
msg(el.reportMessage,"Load reports first.","error");
return;
}

const box=document.createElement("div");

box.className="pdf-export-sheet";

let html=`<h1>AutoKnowledge Pro AI</h1>`;
html+=`<p>Workshop Report Export</p><br>`;

allReports.forEach(r=>{

html+=`
<div class="pdf-export-card">
<h3>${r.fault}</h3>
<p>Confidence: ${r.confidence}%</p>
<p>${r.explanation}</p>
<pre class="pdf-export-steps">${r.steps}</pre>
</div>
`;

});

box.innerHTML=html;

html2pdf().from(box).save("autoknowledge-report.pdf");
}

watchAuthState(user=>{

if(user){
el.userStatus.textContent="Logged in: " + user.email;
el.logoutBtn.hidden=false;
}else{
el.userStatus.textContent="Not logged in";
el.logoutBtn.hidden=true;
}

});

el.loginBtn.onclick=login;
el.signupBtn.onclick=signup;
el.logoutBtn.onclick=logout;
el.runAiBtn.onclick=runAI;
el.saveReportBtn.onclick=save;
el.lookupBtn.onclick=lookup;
el.loadReportsBtn.onclick=loadReports;
el.exportPdfBtn.onclick=exportPDF;

el.reportSearch.oninput=applyFilters;
el.reportSort.onchange=applyFilters;

el.saveReportBtn.disabled=true;

runAI();