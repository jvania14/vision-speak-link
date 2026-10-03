import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import animationData from "./lock.json"; // Update with your actual path

const LockAnimation = ({isOn}:any) => {
  const lottieRef = useRef(null);

  const [isFullyOn, setIsFullyOn] = useState(false);

  useEffect(() => {
    
    if(lottieRef.current){

    
    const anim = lottie.loadAnimation({
      container: lottieRef.current,
      renderer: "svg",
      loop: false, // We do not want the animation to loop
      autoplay: false, // Don't autoplay the animation
      animationData: animationData, // Lottie animation data
    });


    // If isOn is true, play forward from frame 1 to 25
    if (isOn) {
      anim.playSegments([1, 14], true); 
      const interval = setInterval(()=>{
        setIsFullyOn(true);
        clearInterval(interval);
      },500) // Play from frame 1 to 25
    } else {
      // If isOn is false, play in reverse from frame 25 to 1
      anim.playSegments([14, 1], true);
      const interval = setInterval(()=>{
        setIsFullyOn(false);
        clearInterval(interval);
      },500)
    }


    return () => anim.destroy(); // Cleanup on unmount
    }
  }, [isOn]);

  return (

      <div ref={lottieRef} className={`absolute w-28  ${(isFullyOn) ? "drop-shadow-glow" : ""}`}/>

  );
};

export default LockAnimation;
