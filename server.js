const express=require("express");
const http=require("http");
const path=require("path");
const QRCode=require("qrcode");
const {Server}=require("socket.io");

const app=express(), server=http.createServer(app), io=new Server(server);
app.use(express.json());
app.use(express.static(__dirname));

let state={
  question:"Qual palavra representa melhor uma boa liderança?",
  active:true,
  answers:[]
};

const clean=s=>String(s||"").trim().replace(/\s+/g," ").slice(0,80);
const norm=s=>clean(s).toLocaleLowerCase("pt-BR");

function data(){
  const map=new Map();
  state.answers.forEach(a=>{
    const k=norm(a);
    if(k) map.set(k,(map.get(k)||0)+1);
  });
  const words=[...map.entries()].map(([text,count])=>({text,count}))
    .sort((a,b)=>b.count-a.count||a.text.localeCompare(b.text,"pt-BR"));
  return {question:state.question,active:state.active,total:state.answers.length,words};
}
function broadcast(){io.emit("update",data())}

app.get("/api/state",(req,res)=>res.json(data()));
app.get("/api/qr",async(req,res)=>{
  const host=String(req.query.host||"").replace(/\/$/,"");
  const url=host+"/aluno.html";
  res.json({url, dataUrl:await QRCode.toDataURL(url,{width:700,margin:2,errorCorrectionLevel:"M"})});
});
app.post("/api/question",(req,res)=>{
  const q=clean(req.body.question);
  if(!q)return res.status(400).json({error:"Digite uma pergunta."});
  state.question=q;state.answers=[];state.active=true;broadcast();res.json(data());
});
app.post("/api/answer",(req,res)=>{
  if(!state.active)return res.status(403).json({error:"A votação está encerrada."});
  const a=clean(req.body.answer);
  if(!a)return res.status(400).json({error:"Digite uma resposta."});
  state.answers.push(a);broadcast();res.json({ok:true});
});
app.post("/api/toggle",(req,res)=>{state.active=!state.active;broadcast();res.json(data())});
app.post("/api/reset",(req,res)=>{state.answers=[];state.active=true;broadcast();res.json(data())});

server.listen(process.env.PORT||3000,"0.0.0.0",()=>console.log("Pergunta ao Vivo iniciado."));
