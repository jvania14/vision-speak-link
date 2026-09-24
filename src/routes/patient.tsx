import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CameraFeed, CommunicationHistory, EmergencyModal, HealthcareQuickActions, MessageComposer, RecognitionCard, RecognitionPipeline, SectionLabel } from "@/components/ProductComponents";
import { useRecognition } from "@/hooks/useRecognition";
import { useApp } from "@/context/AppContext";

export const Route = createFileRoute("/patient")({ head:()=>({meta:[{title:"Patient Mode — Silent Talk"},{name:"description",content:"Use Silent Talk's camera-ready patient communication workspace."},{property:"og:title",content:"Patient Mode — Silent Talk"},{property:"og:description",content:"Camera, recognition, text, speech, and healthcare quick actions in one accessible workspace."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}), component: PatientMode });

function PatientMode(){
  const recognition=useRecognition();
  const {message,setMessage,history,commitMessage,speak}=useApp();
  const [emergency,setEmergency]=useState(false);
  const [clearing,setClearing]=useState(false);
  useEffect(()=>{if(recognition.recognizedText) setMessage(recognition.recognizedText)},[recognition.recognizedText,setMessage]);
  const clear=async()=>{setClearing(true);setMessage("");try{await recognition.reset()}catch{}finally{setClearing(false)}};
  const select=(phrase:string)=>{commitMessage(phrase)};
  const say=()=>{commitMessage(message);speak(message)};
  const statusCopy = recognition.cameraStatus !== "available"
    ? (recognition.cameraError ?? "Waiting for camera access")
    : recognition.backendStatus === "unreachable"
      ? "Backend disconnected"
      : recognition.backendStatus === "connected"
        ? (recognition.handDetected ? "Recognizing hand shape" : "Searching for hand in view")
        : "Connecting to recognition backend";
  const pipelineActive = recognition.cameraStatus === "available" && recognition.backendStatus === "connected";
  const statusClass = pipelineActive ? "online" : (recognition.cameraStatus === "unavailable" || recognition.backendStatus === "unreachable") ? "offline" : "";
  return <div className="page-wrap"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><SectionLabel>Patient mode</SectionLabel><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Communication workspace</h1></div><p className={`status-copy ${statusClass}`}>{statusCopy}</p></div><div className="mt-8 grid gap-5 xl:grid-cols-[1.55fr_.75fr]"><CameraFeed videoRef={recognition.videoRef} canvasRef={recognition.canvasRef} cameraStatus={recognition.cameraStatus} cameraError={recognition.cameraError} backendStatus={recognition.backendStatus} handDetected={recognition.handDetected} recognizing={recognition.recognizing}/><RecognitionCard recognizedCharacter={recognition.recognizedCharacter} confidence={recognition.confidence} status={recognition.recognizing ? "Recognizing…" : pipelineActive ? "Searching for hand" : "Waiting for camera/backend"}/></div><div className="mt-5"><RecognitionPipeline active={pipelineActive}/></div><div className="mt-8 grid gap-5 xl:grid-cols-[1.5fr_.8fr]"><MessageComposer value={message} setValue={setMessage} onClear={clear} onSpeak={say} clearing={clearing}/><CommunicationHistory entries={history}/></div><div className="mt-8"><HealthcareQuickActions onSelect={select} onEmergency={()=>setEmergency(true)}/></div><EmergencyModal open={emergency} onOpenChange={setEmergency} onSpeak={()=>{commitMessage("I NEED IMMEDIATE HELP");speak("I NEED IMMEDIATE HELP");setEmergency(false)}}/></div>
}