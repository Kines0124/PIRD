import { useState } from "react";
import Step1Identity    from "./Step1Identity";
import Step2Professional from "./Step2Professional";
import PendingScreen    from "./PendingScreen";

export default function EspecialistaForm() {
  const [step,     setStep]     = useState(1);
  const [userData, setUserData] = useState(null);

  if (step === 1) return <Step1Identity onNext={data => { setUserData(data); setStep(2); }} />;
  if (step === 2) return <Step2Professional userData={userData} onNext={() => setStep(3)} onBack={() => setStep(1)} />;
  return <PendingScreen />;
}
