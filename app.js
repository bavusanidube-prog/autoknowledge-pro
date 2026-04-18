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
btn.textContent=btn.dataset.old || btn.textContent;
btn.disabled=false;
}
}

function escapeHtml(value){
return String(value ?? "")
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#39;");
}

function formatDate(value){
if(!value) return "Unknown date";

if(typeof value.toDate === "function"){
return value.toDate().toLocaleString();
}

const d = new Date(value);
if(Number.isNaN(d.getTime())) return "Unknown date";
return d.toLocaleString();
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
try{
await logoutUser();
msg(el.authMessage,"Logged out.","success");
}catch(error){
msg(el.authMessage,error.message,"error");
}
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
<h3>${escapeHtml(r.fault)}</h3>
<div class="report-meta">Confidence: ${escapeHtml(r.confidence)}%</div>
<div class="report-meta">${escapeHtml(r.explanation)}</div>
<pre>${escapeHtml(r.steps)}</pre>
`;

el.reportList.appendChild(card);
});
}

async function loadReports(){
loading(el.loadReportsBtn,true,"Loading...");

try{
allReports = await getMyReports();
applyFilters();
msg(el.reportMessage,"Reports loaded.","success");
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
(r.explanation || "").toLowerCase().includes(q) ||
(r.steps || "").toLowerCase().includes(q)
);
}

if(el.reportSort.value==="confidence"){
list.sort((a,b)=>(b.confidence || 0) - (a.confidence || 0));
}else if(el.reportSort.value==="oldest"){
list.sort((a,b)=>new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0) - new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0));
}else{
list.sort((a,b)=>new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0) - new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0));
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

el.codeOut.textContent = out.trim();
}

function exportPDF(){
if(!allReports.length){
msg(el.reportMessage,"Load reports first.","error");
return;
}

const printWindow = window.open("", "_blank");

if(!printWindow){
msg(el.reportMessage,"Popup blocked. Allow popups and try again.","error");
return;
}

const cards = allReports.map((r, index) => `
<div class="pdf-card">
<h2>${index + 1}. ${escapeHtml(r.fault)}</h2>
<p><strong>Confidence:</strong> ${escapeHtml(r.confidence)}%</p>
<p><strong>Saved:</strong> ${escapeHtml(formatDate(r.createdAt))}</p>
<p><strong>Explanation:</strong> ${escapeHtml(r.explanation)}</p>
<pre>${escapeHtml(r.steps)}</pre>
</div>
`).join("");

printWindow.document.open();
printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AutoKnowledge Pro AI Report Export</title>
<style>
body{
font-family:Arial,sans-serif;
color:#0f172a;
background:#ffffff;
margin:0;
padding:24px;
}
.header{
margin-bottom:20px;
padding-bottom:12px;
border-bottom:2px solid #0ea5e9;
}
h1{
margin:0 0 8px 0;
font-size:28px;
color:#0369a1;
}
.meta{
font-size:14px;
color:#475569;
margin:4px 0;
}
.pdf-card{
border:1px solid #cbd5e1;
border-radius:12px;
padding:16px;
margin-bottom:16px;
break-inside:avoid;
page-break-inside:avoid;
}
.pdf-card h2{
margin:0 0 10px 0;
font-size:18px;
color:#0f172a;
}
.pdf-card p{
margin:6px 0;
line-height:1.5;
}
.pdf-card pre{
white-space:pre-wrap;
background:#f8fafc;
padding:12px;
border-radius:8px;
line-height:1.6;
}
@media print{
body{
padding:12mm;
}
}
</style>
</head>
<body>
<div class="header">
<h1>AutoKnowledge Pro AI</h1>
<div class="meta">Workshop Report Export</div>
<div class="meta">Generated: ${escapeHtml(new Date().toLocaleString())}</div>
<div class="meta">User: ${escapeHtml(el.userStatus.textContent)}</div>
<div class="meta">Total Reports: ${allReports.length}</div>
</div>
${cards}
<script>
window.onload = function(){
window.print();
};
</script>
</body>
</html>
`);
printWindow.document.close();

msg(el.reportMessage,"Print dialog opened. Choose Save as PDF.","success");
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